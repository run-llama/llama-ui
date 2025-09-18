import { useMemo, useEffect } from "react";
import { useHandlerStore } from "./use-handler-store";
import type { WorkflowProgressState, RunStatus } from "../types";

export function useWorkflowProgress(): WorkflowProgressState {
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
    const handlerArray = Object.values(handlers).filter(
      (handler) => handler.status === "running"
    );
    const total = handlerArray.length;

    if (total === 0) {
      return {
        current: 0,
        total: 0,
        status: "idle" as RunStatus,
      };
    }

    // Count completed handlers
    const completedHandlers = handlerArray.filter(
      (handler) => handler.status === "complete"
    );
    const current = completedHandlers.length;

    // Determine overall status
    let status: RunStatus;

    // Check for error handlers first
    if (handlerArray.some((handler) => handler.status === "failed")) {
      status = "failed";
    }
    // Check if all handlers are complete
    else if (current === total) {
      status = "complete";
    }
    // Check if any handlers are running
    else if (handlerArray.some((handler) => handler.status === "running")) {
      status = "running";
    }
    // Otherwise, handlers are idle
    else {
      status = "idle";
    }

    return {
      current,
      total,
      status,
    };
  }, [handlers]); // Only recalculate when handlers object reference changes
}
