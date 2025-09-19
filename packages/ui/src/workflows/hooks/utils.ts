import type { WorkflowHandlerSummary } from "../types";

export function filterHandlersByWorkflow(
  handlers: WorkflowHandlerSummary[],
  workflowName: string
): WorkflowHandlerSummary[] {
  return handlers.filter((handler) => {
    if (handler.workflowName) {
      return handler.workflowName === workflowName;
    }

    if (handler.status !== "running") {
      return false;
    }

    // TODO: Filter by workflowName once handler summaries persist workflow metadata.
    return true;
  });
}
