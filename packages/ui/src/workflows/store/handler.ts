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
import { getOrCreate } from "../../shared/store";

export interface HandlerState
  extends Omit<
    RawHandler,
    "status" | "result" | "updated_at" | "completed_at"
  > {
  status: RunStatus;
  updated_at?: Date;
  completed_at?: Date;
  result?: StopEvent;
  // indicates that there is a current sync operation to query the handler state.
  loading: boolean;
  // indicates an error loading the actual handler state. See status "failed" and the error field for actual workflow run errors.
  loadingError?: string;
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
  loading: true,
  loadingError: undefined,
};

export const createState = (
  rawHandler: Partial<RawHandler> = {}
): HandlerState => {
  const state = {
    handler_id: rawHandler.handler_id ?? emptyState.handler_id,
    workflow_name: rawHandler.workflow_name ?? emptyState.workflow_name,
    status: rawHandler.status ?? emptyState.status,
    started_at: rawHandler.started_at ?? emptyState.started_at,
    updated_at: rawHandler.updated_at
      ? new Date(rawHandler.updated_at)
      : emptyState.updated_at,
    completed_at: rawHandler.completed_at
      ? new Date(rawHandler.completed_at)
      : emptyState.completed_at,
    error: rawHandler.error,
    result: rawHandler.result
      ? (StopEvent.fromRawEvent(
          rawHandler.result as EventEnvelopeWithMetadata
        ) as StopEvent)
      : emptyState.result,
    // use "status" field as a canary to indicate that this is a real response
    loading: rawHandler.status ? false : emptyState.loading,
    loadingError: undefined,
  };

  return proxy(state);
};

export function createActions(state: HandlerState, client: Client) {
  const actions = {
    async sendEvent(
      event: WorkflowEvent | EventEnvelopeWithMetadata,
      step?: string
    ) {
      if (!state.handler_id) {
        throw new Error("Handler ID is not yet initialized");
      }
      // convert to raw event before sending
      const rawEvent =
        event instanceof WorkflowEvent ? event.toRawEvent() : event;
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
    async sync() {
      state.loading = true;
      state.loadingError = undefined;
      const resolvedHandlerId = state.handler_id;
      if (!resolvedHandlerId) return;

      try {
        const data = await getHandlersByHandlerId({
          client: client,
          path: { handler_id: resolvedHandlerId },
        });
        const updated = createState(data.data ?? {});

        Object.assign(state, updated);
      } catch (error) {
        state.loadingError =
          error instanceof Error ? error.message : String(error);
      } finally {
        state.loading = false;
      }
    },
    subscribeToEvents(
      callbacks?: StreamSubscriber<WorkflowEvent>,
      includeInternal = false
    ): StreamOperation<WorkflowEvent> {
      if (!state.handler_id) {
        throw new Error("Handler ID is not yet initialized");
      }
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
/**
 * Get's the handler state from the global store or creates a new one if it doesn't exist, and optionally applies an update
 * @param update
 * @returns The updated handler state
 */
export function getOrCreateHandler(update: Partial<RawHandler>): HandlerState {
  const current = getOrCreate(`handler:${update.handler_id}`, () =>
    createState(update)
  );
  return applyUpdateToHandler(current, update);
}

export function applyUpdateToHandler(
  state: HandlerState,
  update: Partial<RawHandler>
): HandlerState {
  const updated = createState(update);
  // mutate existing state instead of creating a new one to maintain global singleton
  Object.assign(state, updated);
  return state;
}
