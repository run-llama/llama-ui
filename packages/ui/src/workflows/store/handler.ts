import {
  Client,
  Handler as RawHandler,
  getResultsByHandlerId,
  postEventsByHandlerId,
  postHandlersByHandlerIdCancel,
} from "@llamaindex/workflows-client";
import { RawEvent, RunStatus } from "../types";
import {
  StreamOperation,
  StreamSubscriber,
  workflowStreamingManager,
} from "../../lib/shared-streaming";
import { logger } from "@llamaindex/shared";
import { StopEvent, WorkflowEvent, WorkflowEventType } from "./workflow-event";

/**
 * This handler won't communicate with server to sync status unless developers explicitly call stream.
 */
export class Handler {
  handlerId: string;
  workflowName: string;
  status: RunStatus;
  startedAt: Date;
  updatedAt?: Date | null;
  completedAt?: Date | null;
  error?: string | null;
  result?: StopEvent | null;

  _disconnect?: () => void;
  _unsubscribe?: () => void;
  _canceler?: () => Promise<void>;

  constructor(
    rawHandler: RawHandler,
    private readonly client: Client
  ) {
    this.handlerId = rawHandler.handler_id;
    this.workflowName = rawHandler.workflow_name;
    this.status = rawHandler.status;
    this.startedAt = new Date(rawHandler.started_at);
    this.updatedAt = rawHandler.updated_at
      ? new Date(rawHandler.updated_at)
      : null;
    this.completedAt = rawHandler.completed_at
      ? new Date(rawHandler.completed_at)
      : null;
    this.error = rawHandler.error;
    this.result = rawHandler.result
      ? (WorkflowEvent.fromRawEvent(rawHandler.result as RawEvent) as StopEvent)
      : null;
  }

  async sendEvent<E extends WorkflowEvent>(event: E, step?: string) {
    const rawEvent = event.toRawEvent(); // convert to raw event before sending
    const data = await postEventsByHandlerId({
      client: this.client,
      path: { handler_id: this.handlerId },
      body: {
        event: JSON.stringify(rawEvent),
        step: step,
      },
    });

    return data.data;
  }

  async getResult(): Promise<StopEvent | undefined> {
    const data = await getResultsByHandlerId({
      client: this.client,
      path: { handler_id: this.handlerId },
    });
    return data.data?.result
      ? (WorkflowEvent.fromRawEvent(data.data.result as RawEvent) as StopEvent)
      : undefined;
  }

  subscribeToEvents(
    callbacks?: StreamSubscriber<WorkflowEvent>,
    includeInternal = false
  ): StreamOperation<WorkflowEvent> {
    const streamKey = `handler:${this.handlerId}`;

    // Convert callback to SharedStreamingManager subscriber
    // Be aware that all datetimes below are not synced with server, only client local state update
    const subscriber: StreamSubscriber<WorkflowEvent> = {
      onStart: () => {
        this.status = "running";
        callbacks?.onStart?.();
      },
      onData: (event) => {
        this.updatedAt = new Date();
        callbacks?.onData?.(event);
      },
      onError: (error) => {
        this.status = "failed";
        this.completedAt = new Date();
        this.updatedAt = new Date();
        this.error = error.message;
        callbacks?.onError?.(error);
      },
      onSuccess: (events) => {
        this.status = "completed";
        this.completedAt = new Date();
        this.updatedAt = new Date();
        this.result = events[events.length - 1] as StopEvent;
        callbacks?.onSuccess?.(events);
      },
      onComplete: () => {
        this.completedAt = new Date();
        this.updatedAt = new Date();
        callbacks?.onComplete?.();
      },
    };

    const canceler = async () => {
      await postHandlersByHandlerIdCancel({
        client: this.client,
        path: {
          handler_id: this.handlerId,
        },
      });
    };

    // Use SharedStreamingManager to handle the streaming with deduplication
    const { promise, unsubscribe, disconnect, cancel } =
      workflowStreamingManager.subscribe(
        streamKey,
        subscriber,
        async (subscriber, signal) => {
          return streamByEventSource(
            {
              client: this.client,
              handlerId: this.handlerId,
              includeInternal: includeInternal,
              abortSignal: signal,
            },
            subscriber
          );
        },
        canceler
      );

    this._disconnect = disconnect;
    this._unsubscribe = unsubscribe;
    this._canceler = canceler;

    return { promise, unsubscribe, disconnect, cancel };
  }

  disconnect(): void {
    if (!this._disconnect) {
      throw new Error("Handler not subscribed yet");
    }
    this._disconnect?.();
  }

  unsubscribe(): void {
    if (!this._unsubscribe) {
      throw new Error("Handler not subscribed yet");
    }
    this._unsubscribe?.();
  }

  cancel(): void {
    if (!this._canceler) {
      throw new Error("Handler not subscribed yet");
    }
    this._canceler?.();
  }
}

function streamByEventSource(
  params: {
    client: Client;
    handlerId: string;
    includeInternal?: boolean;
    abortSignal?: AbortSignal;
  },
  callbacks: StreamSubscriber<WorkflowEvent>
) {
  return new Promise<WorkflowEvent[]>((resolve) => {
    const baseUrl = (params.client.getConfig().baseUrl ?? "").replace(
      /\/$/,
      ""
    );
    const urlParams = new URLSearchParams();
    urlParams.set("sse", "true");
    if (params.includeInternal) {
      urlParams.set("include_internal", "true");
    }
    const accumulatedEvents: WorkflowEvent[] = [];
    const eventSource = new EventSource(
      `${baseUrl}/events/${encodeURIComponent(params.handlerId)}?${urlParams.toString()}`,
      {
        withCredentials: true,
      }
    );
    if (params.abortSignal) {
      params.abortSignal.addEventListener("abort", () => {
        eventSource.close();
      });
    }

    eventSource.addEventListener("message", (event) => {
      logger.debug("[streamByEventSource] message", JSON.parse(event.data));
      const workflowEvent = WorkflowEvent.fromRawEvent(
        JSON.parse(event.data) as RawEvent
      );
      callbacks.onData?.(workflowEvent);
      accumulatedEvents.push(workflowEvent);
      if (workflowEvent.type === WorkflowEventType.StopEvent) {
        callbacks.onSuccess?.(accumulatedEvents);
        logger.debug(
          "[streamByEventSource] stop event received, closing event source"
        );
        eventSource.close();
        resolve(accumulatedEvents);
      }
    });
    eventSource.addEventListener("error", (event) => {
      // Ignore error for now due to EventSource limitations.
      // 1. Now py server close sse connection and will always trigger error event even readyState is 2 (CLOSED)
      // 2. The error event isself is a general event without any error information
      // TODO: swtich to more fetch + stream approach
      logger.warn("[streamByEventSource] error", event);
      return;
    });
    eventSource.addEventListener("open", () => {
      logger.debug("[streamByEventSource] open");
      callbacks.onStart?.();
    });
    eventSource.addEventListener("close", () => {
      logger.debug("[streamByEventSource] close");
      callbacks.onSuccess?.(accumulatedEvents);
      resolve(accumulatedEvents);
    });
  });
}
