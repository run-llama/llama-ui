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

/**
 * Options for `subscribeToEvents`.
 */
export interface SubscribeToEventsOptions {
  /** Include internal workflow events (step state changes etc.). */
  includeInternal?: boolean;
  /**
   * Sequence cursor passed to the server as `after_sequence`. Omit to let the
   * client auto-resume from the last event it observed for this handler, or
   * pass `"now"` to explicitly skip history. Use `-1` to replay from the
   * beginning. Note: `SharedStreamingManager` dedupes concurrent subscribers
   * on the same handler — only the first subscriber's cursor drives the
   * underlying connection.
   */
  afterSequence?: number | "now";
}

// Module-private cursor store, keyed by handler_id. Kept off the valtio state
// to avoid a proxy mutation per event for consumers using whole-state
// snapshots.
const handlerCursors = new Map<string, string>();

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
        const response = await getHandlersByHandlerId({
          client: client,
          path: { handler_id: resolvedHandlerId },
        });

        // hey-api client with ThrowOnError=false returns { data, error }
        // For 500 responses, data is undefined and error contains the response body
        // The server returns 500 for failed handlers but still includes valid handler data
        if (response.error) {
          const errorBody = response.error as unknown;
          // Check if error body is actually valid handler data
          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "handler_id" in errorBody &&
            "status" in errorBody
          ) {
            // Use the handler data from the 500 response
            const updated = createState(errorBody as Partial<RawHandler>);
            Object.assign(state, updated);
            return;
          }
          // Otherwise it's a real API error
          const errorDetail =
            typeof errorBody === "object" &&
            errorBody !== null &&
            "detail" in errorBody
              ? String((errorBody as { detail: unknown }).detail)
              : String(errorBody);
          state.loadingError = errorDetail;
          return;
        }

        if (response.data) {
          const updated = createState(response.data);
          Object.assign(state, updated);
        }
      } catch (error) {
        state.loadingError =
          error instanceof Error ? error.message : String(error);
      } finally {
        state.loading = false;
      }
    },
  };

  /**
   * Subscribe to the SSE event stream for this handler.
   *
   * When no `afterSequence` is provided the client auto-resumes from the last
   * event id observed for this handler (within the current session) so that
   * tearing down and re-subscribing doesn't drop events emitted in between.
   */
  function subscribeToEvents(
    callbacks?: StreamSubscriber<WorkflowEvent>,
    options?: SubscribeToEventsOptions
  ): StreamOperation<WorkflowEvent>;
  /**
   * @deprecated Pass `{ includeInternal }` as the second argument instead.
   */
  function subscribeToEvents(
    callbacks: StreamSubscriber<WorkflowEvent> | undefined,
    includeInternal: boolean
  ): StreamOperation<WorkflowEvent>;
  function subscribeToEvents(
    callbacks?: StreamSubscriber<WorkflowEvent>,
    optionsOrIncludeInternal?: SubscribeToEventsOptions | boolean
  ): StreamOperation<WorkflowEvent> {
    if (!state.handler_id) {
      throw new Error("Handler ID is not yet initialized");
    }
    const options: SubscribeToEventsOptions =
      typeof optionsOrIncludeInternal === "boolean"
        ? { includeInternal: optionsOrIncludeInternal }
        : (optionsOrIncludeInternal ?? {});
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

    const resolvedAfterSequence = resolveAfterSequence(
      options.afterSequence,
      handlerCursors.get(state.handler_id)
    );

    const { promise, unsubscribe, disconnect, cancel } =
      workflowStreamingManager.subscribe(
        streamKey,
        subscriber,
        async (subscriber, signal) => {
          return streamByEventSource(
            {
              client: client,
              handlerId: state.handler_id,
              includeInternal: options.includeInternal,
              afterSequence: resolvedAfterSequence,
              abortSignal: signal,
            },
            subscriber,
            fullActions,
            state
          );
        },
        canceler
      );

    return { promise, unsubscribe, disconnect, cancel };
  }

  const fullActions = { ...actions, subscribeToEvents };
  return fullActions;
}

function resolveAfterSequence(
  explicit: number | "now" | undefined,
  stored: string | undefined
): number | "now" | undefined {
  if (explicit !== undefined) return explicit;
  if (stored === undefined) return undefined;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function streamByEventSource(
  params: {
    client: Client;
    handlerId: string;
    includeInternal?: boolean;
    afterSequence?: number | "now";
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
    if (params.afterSequence !== undefined) {
      urlParams.set("after_sequence", String(params.afterSequence));
    }
    const accumulatedEvents: WorkflowEvent[] = [];
    let settled = false;
    const eventSource = new EventSource(
      `${baseUrl}/events/${encodeURIComponent(params.handlerId)}?${urlParams.toString()}`,
      {
        withCredentials: true,
      }
    );
    if (params.abortSignal) {
      params.abortSignal.addEventListener("abort", () => {
        settled = true;
        eventSource.close();
      });
    }

    const finish = async () => {
      await actions.sync();
      // Handler has drained at this point; drop any stored cursor so the next
      // subscribe (for a fresh run that reuses the handler id, or a resubscribe
      // to the terminal state) starts clean.
      handlerCursors.delete(params.handlerId);
      if (state.status === "completed") {
        callbacks.onSuccess?.(accumulatedEvents);
      } else if (state.status === "failed") {
        callbacks.onError?.(new Error(state.error || "Server Error"));
      } else if (state.status === "cancelled") {
        callbacks.onCancel?.();
      } else {
        // Stream closed but the handler isn't in a terminal state. Shouldn't
        // happen in practice; surface as an error rather than silently
        // succeeding.
        callbacks.onError?.(
          new Error(`Stream closed while handler status was ${state.status}`)
        );
      }
      resolve(accumulatedEvents);
    };

    eventSource.addEventListener("message", (event) => {
      logger.debug("[streamByEventSource] message", JSON.parse(event.data));
      const workflowEvent = WorkflowEvent.fromRawEvent(
        JSON.parse(event.data) as EventEnvelopeWithMetadata
      );
      // Record the server's sequence id so a subsequent subscribe can resume
      // from exactly here without dropping events.
      if (event.lastEventId) {
        handlerCursors.set(params.handlerId, event.lastEventId);
      }
      callbacks.onData?.(workflowEvent);
      accumulatedEvents.push(workflowEvent);
      if (isStopEvent(workflowEvent)) {
        if (settled) return;
        settled = true;
        eventSource.close();
        void finish();
      }
    });
    eventSource.addEventListener("error", (event) => {
      if (settled) return;
      // The workflow server closes the SSE connection by surfacing an `error`
      // event with readyState === CLOSED, including for the 204 "handler
      // drained" response. That's a clean close — flush what we have and
      // don't log, otherwise every drained re-subscribe spams a warning.
      // A non-CLOSED readyState means the browser will auto-reconnect; log
      // because that's genuinely unexpected here.
      if (eventSource.readyState === EventSource.CLOSED) {
        settled = true;
        void finish();
        return;
      }
      logger.warn("[streamByEventSource] error", event);
    });
    eventSource.addEventListener("open", () => {
      logger.debug("[streamByEventSource] open");
      callbacks.onStart?.();
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
