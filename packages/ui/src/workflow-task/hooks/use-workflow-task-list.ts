/**
 * useWorkflowTaskList Hook
 * Based on workflow-task-suite.md specifications
 */

import { useEffect, useMemo, useState } from "react";
import { useTaskStore } from "./use-task-store";
import type { WorkflowHandlerSummary } from "../types";

interface UseWorkflowTaskListResult {
  tasks: WorkflowHandlerSummary[];
  clearCompleted: () => void;
  loading: boolean;
  error: string | null;
}

export function useWorkflowTaskList(): UseWorkflowTaskListResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const store = useTaskStore();
  const tasksRecord = store.tasks;
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
  const filteredTasks = useMemo(() => {
    const allTasks = Object.values(tasksRecord);
    return allTasks;
  }, [tasksRecord]);

  return {
    tasks: filteredTasks,
    clearCompleted,
    loading,
    error,
  };
}
