/**
 * useWorkflowTaskList Hook
 * Based on workflow-task-suite.md specifications
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTaskStore } from "./use-task-store";
import { useDeployment } from "../../lib/api-provider";
import type { WorkflowTaskSummary } from "../types";

interface UseWorkflowTaskListResult {
  tasks: WorkflowTaskSummary[];
  clearCompleted: () => void;
  loading: boolean;
  error: string | null;
}

export interface UseWorkflowTaskListOptions {
  onTaskResult?: (task: WorkflowTaskSummary) => void;
}

export function useWorkflowTaskList({
  onTaskResult,
}: UseWorkflowTaskListOptions = {}): UseWorkflowTaskListResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get deployment from context and store methods
  const deployment = useDeployment();
  const store = useTaskStore();
  const tasksRecord = store.tasks;
  const clearCompleted = store.clearCompleted;
  const sync = store.sync;

  // Sync with server on mount and when deployment changes
  useEffect(() => {
    async function syncWithServer() {
      setLoading(true);
      setError(null);

      try {
        await sync(deployment);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to sync with server"
        );
      } finally {
        setLoading(false);
      }
    }

    syncWithServer();
  }, [deployment, sync]);

  // Memoize tasks array and filtering based on tasksRecord
  const filteredTasks = useMemo(() => {
    const allTasks = Object.values(tasksRecord);
    return allTasks.filter((task) => task.deployment === deployment);
  }, [tasksRecord, deployment]);

  const runningTasks = useMemo(() => {
    return filteredTasks.filter((task) => task.status === "running");
  }, [filteredTasks]);
  const prevRunningTasks = useRef(runningTasks);
  useEffect(() => {
    const currentTaskIds = new Set(runningTasks.map((task) => task.task_id));
    const removedTaskIds = new Set(
      [...prevRunningTasks.current.map((task) => task.task_id)].filter(
        (id) => !currentTaskIds.has(id)
      )
    );
    removedTaskIds.forEach((taskId) => {
      onTaskResult?.(tasksRecord[taskId]);
    });
    prevRunningTasks.current = runningTasks;
  }, [runningTasks, onTaskResult, tasksRecord]);

  return {
    tasks: filteredTasks,
    clearCompleted,
    loading,
    error,
  };
}
