import {
  Client,
  EventEnvelopeWithMetadata,
  getHandlers,
} from "@llamaindex/workflows-client";
import { HandlerState } from "./handler";
import { proxy } from "valtio";
import { StopEvent } from "./workflow-event";

export interface HandlersQuery {
  workflow_name?: string[];
  status?: ("running" | "completed" | "failed" | "cancelled")[];
}
export interface HandlersState {
  query: HandlersQuery;
  handlers: Record<string, HandlerState>;
  loading: boolean;
  loadingError?: string;
}

export const createState = ({
  query,
}: {
  query?: HandlersQuery;
} = {}): HandlersState => {
  return proxy({
    query: query ?? {},
    loading: true,
    error: undefined,
    handlers: {},
  });
};

export function createActions(state: HandlersState, client: Client) {
  return {
    async sync() {
      state.loading = true;
      state.loadingError = undefined;
      try {
        const resp = await getHandlers({
          client: client,
          query: state.query,
        });

        const allHandlers = resp.data?.handlers ?? [];
        allHandlers.forEach((h) => {
          state.handlers[h.handler_id] = {
            handler_id: h.handler_id,
            workflow_name: h.workflow_name,
            status: h.status,
            started_at: h.started_at,
            updated_at: h.updated_at ? new Date(h.updated_at) : undefined,
            completed_at: h.completed_at ? new Date(h.completed_at) : undefined,
            error: h.error,
            result: h.result
              ? (StopEvent.fromRawEvent(
                  h.result as EventEnvelopeWithMetadata
                ) as StopEvent)
              : undefined,
            loading: false,
            loadingError: undefined,
          };
        });
      } catch (error) {
        state.loadingError =
          error instanceof Error ? error.message : String(error);
      } finally {
        state.loading = false;
      }
    },
    setHandler(handler: HandlerState) {
      state.handlers[handler.handler_id] = handler;
    },
  };
}
