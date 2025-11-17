import {
  Client,
  EventEnvelopeWithMetadata,
  Handler as RawHandler,
  getHandlersByHandlerId,
  postEventsByHandlerId,
  postHandlersByHandlerIdCancel,
} from "@llamaindex/workflows-client";
import { RunStatus } from "../types";
import {
  StreamOperation,
  StreamSubscriber,
  workflowStreamingManager,
} from "../../lib/shared-streaming";
import { logger } from "@shared/logger";
import { isStopEvent, StopEvent, WorkflowEvent } from "./workflow-event";
import { proxy } from "valtio";

export interface HandlerState
  extends Omit<
    RawHandler,
    "status" | "result" | "updated_at" | "completed_at"
  > {
  status: RunStatus;
  updated_at?: Date;
  completed_at?: Date;
  result?: StopEvent;
}

const emptyState: HandlerState = {
  handler_id: "",
  workflow_name: "",
  status: "not_started",
  started_at: "",
  updated_at: undefined,
  completed_at: undefined,
  error: "",
  result: undefined,
};

export const createState = (rawHandler?: RawHandler): HandlerState => {
  const state = rawHandler
    ? {
        handler_id: rawHandler.handler_id,
        workflow_name: rawHandler.workflow_name,
        status: rawHandler.status,
        started_at: rawHandler.started_at,
        updated_at: rawHandler.updated_at
          ? new Date(rawHandler.updated_at)
          : undefined,
        completed_at: rawHandler.completed_at
          ? new Date(rawHandler.completed_at)
          : undefined,
        error: rawHandler.error,
        result: rawHandler.result
          ? (StopEvent.fromRawEvent(
              rawHandler.result as EventEnvelopeWithMetadata
            ) as StopEvent)
          : undefined,
      }
    : emptyState;

  return proxy(state);
};

export function createActions(state: HandlerState, client: Client) {
  const actions = {
    async sendEvent(event: WorkflowEvent, step?: string) {
      const rawEvent = event.toRawEvent(); // convert to raw event before sending
      const data = await postEventsByHandlerId({
        client: client,
        path: { handler_id: state.handler_id },
        body: {
          event: rawEvent,
          step: step,
        },
      });

      return data.data;
    },
    async sync(handlerId?: string) {
      const data = await getHandlersByHandlerId({
        client: client,
        path: { handler_id: handlerId ?? state.handler_id },
      });

      Object.assign(state, data.data, {
        updated_at: data.data?.updated_at
          ? new Date(data.data.updated_at)
          : undefined,
        completed_at: data.data?.completed_at
          ? new Date(data.data.completed_at)
          : undefined,
        result: data.data?.result
          ? (StopEvent.fromRawEvent(
              data.data.result as EventEnvelopeWithMetadata
            ) as StopEvent)
          : undefined,
      });
    },
    subscribeToEvents(
      callbacks?: StreamSubscriber<WorkflowEvent>,
      includeInternal = false
    ): StreamOperation<WorkflowEvent> {
      const streamKey = `handler:${state.handler_id}`;

      // Convert callback to SharedStreamingManager subscriber
      // Be aware that all datetimes below are not synced with server, only client local state update
      const subscriber: StreamSubscriber<WorkflowEvent> = {
        onStart: () => {
          state.status = "running";
          callbacks?.onStart?.();
        },
        onData: (event) => {
          state.updated_at = new Date();
          callbacks?.onData?.(event);
        },
        onError: (error) => {
          state.status = "failed";
          state.completed_at = new Date();
          state.updated_at = new Date();
          state.error = error.message;
          callbacks?.onError?.(error);
        },
        onSuccess: (events) => {
          state.status = "completed";
          state.completed_at = new Date();
          state.updated_at = new Date();
          state.result = events[events.length - 1] as StopEvent;
          callbacks?.onSuccess?.(events);
        },
        onComplete: () => {
          state.completed_at = new Date();
          state.updated_at = new Date();
          callbacks?.onComplete?.();
        },
      };

      const canceler = async () => {
        await postHandlersByHandlerIdCancel({
          client: client,
          path: {
            handler_id: state.handler_id,
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
                client: client,
                handlerId: state.handler_id,
                includeInternal: includeInternal,
                abortSignal: signal,
              },
              subscriber,
              actions,
              state
            );
          },
          canceler
        );

      return { promise, unsubscribe, disconnect, cancel };
    },
  };
  return actions;
}

function streamByEventSource(
  params: {
    client: Client;
    handlerId: string;
    includeInternal?: boolean;
    abortSignal?: AbortSignal;
  },
  callbacks: StreamSubscriber<WorkflowEvent>,
  actions: ReturnType<typeof createActions>,
  state: HandlerState
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
        JSON.parse(event.data) as EventEnvelopeWithMetadata
      );
      callbacks.onData?.(workflowEvent);
      accumulatedEvents.push(workflowEvent);
      if (isStopEvent(workflowEvent)) {
        eventSource.close();
        actions.sync().then(() => {
          if (state.status === "completed") {
            callbacks.onSuccess?.(accumulatedEvents);
          } else if (state.status === "failed") {
            callbacks.onError?.(new Error(state.error || "Server Error"));
          } else if (state.status === "cancelled") {
            callbacks.onCancel?.();
          } else {
            // This should never happen
            throw new Error(
              `[This should never happen] Unexpected running status: ${state.status}`
            );
          }
          resolve(accumulatedEvents);
        });
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
