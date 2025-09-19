import { useMemo, useEffect } from "react";
import { useHandlerStore } from "./use-handler-store";
import { filterHandlersByWorkflow } from "./utils";
import type { WorkflowProgressState, RunStatus } from "../types";

export function useWorkflowProgress(
  workflowName: string
): WorkflowProgressState {
  const store = useHandlerStore();
  const handlers = store.handlers;
  const sync = store.sync;

  useEffect(() => {
    async function syncWithServer() {
      try {
        await sync();
      } catch (error) {
        // eslint-disable-next-line no-console -- needed
        console.error("Failed to sync with server for progress:", error);
      }
    }

    syncWithServer();
  }, [sync]);

  // Memoize the calculation based on handlers object
  return useMemo(() => {
    const handlerArray = filterHandlersByWorkflow(
      Object.values(handlers),
      workflowName
    );
    const total = handlerArray.length;

    if (total === 0) {
      return {
        current: 0,
        total: 0,
        status: "idle" as RunStatus,
      };
    }

    const completedCount = handlerArray.filter(
      (handler) => handler.status === "complete"
    ).length;

    // Determine overall status
    let status: RunStatus;

    if (handlerArray.some((handler) => handler.status === "failed")) {
      status = "failed";
    } else if (completedCount === total) {
      status = "complete";
    } else if (handlerArray.some((handler) => handler.status === "running")) {
      status = "running";
    } else {
      status = "idle";
    }

    return {
      current: completedCount,
      total,
      status,
    };
  }, [handlers, workflowName]);
}
