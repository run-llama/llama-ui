import { Client, getHandlers } from "@llamaindex/workflows-client";
import { proxy } from "valtio";
import {
  createActions as createHandlerActions,
  HandlerState,
  createState as createHandlerState,
  applyUpdateToHandler,
} from "./handler";

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
        const newIds = new Set(allHandlers.map((h) => h.handler_id));
        const oldIds = new Set(Object.keys(state.handlers));
        // reset handlers server state - remove stale
        for (const id of oldIds) {
          if (!newIds.has(id)) {
            delete state.handlers[id];
          }
        }
        // update
        for (const h of allHandlers) {
          state.handlers[h.handler_id] = state.handlers[h.handler_id]
            ? applyUpdateToHandler(state.handlers[h.handler_id], h)
            : createHandlerState(h);
        }
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
    actions(handlerId: string): ReturnType<typeof createHandlerActions> {
      return createHandlerActions(state.handlers[handlerId], client);
    },
  };
}
