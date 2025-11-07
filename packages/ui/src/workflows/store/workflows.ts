import { Client, getWorkflows } from "@llamaindex/workflows-client";
import { proxy } from "valtio";
import { WorkflowState } from "./workflow";

export interface WorkflowsState {
  workflows: Record<string, { name: string }>;
  loading: boolean;
  loadingError?: string;
}

export function createState(): WorkflowsState {
  return proxy({ workflows: {}, loading: true, error: undefined });
}

export function createActions(state: WorkflowsState, client: Client) {
  return {
    async sync() {
      state.loading = true;
      state.loadingError = undefined;
      try {
        const resp = await getWorkflows({
          client: client,
        });
        const allWorkflows = resp.data?.workflows ?? [];
        allWorkflows.forEach((name) => {
          state.workflows[name] = {
            name,
          };
        });
      } catch (error) {
        state.loadingError =
          error instanceof Error ? error.message : String(error);
      } finally {
        state.loading = false;
      }
    },
    setWorkflow(workflow: Omit<WorkflowState, "graph">) {
      state.workflows[workflow.name] = workflow;
    },
  };
}
