import { useEffect, useMemo, useState } from "react";
import { useHandlerStore } from "./use-handler-store";
import type { WorkflowHandlerSummary } from "../types";

interface UseWorkflowHandlerListResult {
  handlers: WorkflowHandlerSummary[];
  clearCompleted: () => void;
  loading: boolean;
  error: string | null;
}

export function useWorkflowHandlerList(
  workflowName: string
): UseWorkflowHandlerListResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const store = useHandlerStore();
  const handlersRecord = store.handlers;
  const clearCompleted = store.clearCompleted;
  const sync = store.sync;

  // Sync with server on mount
  useEffect(() => {
    async function syncWithServer() {
      setLoading(true);
      setError(null);

      try {
        await sync();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to sync with server"
        );
      } finally {
        setLoading(false);
      }
    }

    syncWithServer();
  }, [sync]);

  // Memoize tasks array and filtering based on tasksRecord
  const filteredHandlers = useMemo(() => {
    return Object.values(handlersRecord).filter(
      (handler) => handler.workflowName === workflowName
    );
  }, [handlersRecord, workflowName]);

  return {
    handlers: filteredHandlers,
    clearCompleted,
    loading,
    error,
  };
}
