import {
  Client,
  postWorkflowsByNameRunNowait,
  getWorkflowsByNameRepresentation,
  postWorkflowsByNameRun,
} from "@llamaindex/workflows-client";
import { proxy } from "valtio";
import { createState as createHandlerState, HandlerState } from "./handler";
import { JSONValue } from "../types";

export interface WorkflowState {
  name: string;
  // TODO: add graph type
  graph: unknown | null;
  loading: boolean;
  loadingError?: string;
}

export function createState(name: string): WorkflowState {
  return proxy({
    name,
    graph: null,
    loading: true,
    loadingError: undefined,
  });
}

export function createActions(state: WorkflowState, client: Client) {
  return {
    async sync() {
      state.loading = true;
      state.loadingError = undefined;
      try {
        const data = await getWorkflowsByNameRepresentation({
          client: client,
          path: { name: state.name },
        });
        state.graph = data.data?.graph ?? null;
      } catch (error) {
        state.loadingError =
          error instanceof Error ? error.message : String(error);
      } finally {
        state.loading = false;
      }
    },

    async runToCompletion(input: JSONValue): Promise<HandlerState> {
      const data = await postWorkflowsByNameRun({
        client: client,
        path: { name: state.name },
        body: {
          start_event: input as { [key: string]: unknown } | undefined,
        },
      });

      if (!data.data) {
        throw new Error(`Workflow run empty, response ${JSON.stringify(data)}`);
      }

      return createHandlerState(data.data);
    },

    async createHandler(input: JSONValue, handlerId?: string) {
      const data = await postWorkflowsByNameRunNowait({
        client: client,
        path: { name: state.name },
        body: {
          start_event: input as { [key: string]: unknown } | undefined,
          handler_id: handlerId,
        },
      });

      if (!data.data) {
        throw new Error("Handler creation failed");
      }
      return createHandlerState(data.data);
    },
  };
}
