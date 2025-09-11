/**
 * useWorkflowProgress Hook
 * Based on workflow-task-suite.md specifications
 */

import { useMemo, useEffect } from "react";
import { useTaskStore } from "./use-task-store";
import type { WorkflowProgressState, RunStatus } from "../types";

export function useWorkflowProgress(): WorkflowProgressState {
  // Get deployment from context and store methods
  const store = useTaskStore();
  const tasks = store.tasks;
  const sync = store.sync;

  // Sync with server on mount and when deployment changes
  useEffect(() => {
    async function syncWithServer() {
      try {
        await sync();
      } catch (error) {
        console.error("Failed to sync with server for progress:", error);
      }
    }

    syncWithServer();
  }, [sync]);

  // Memoize the calculation based on tasks object
  return useMemo(() => {
    const taskArray = Object.values(tasks).filter(
      (task) => task.status === "running"
    );
    const total = taskArray.length;

    if (total === 0) {
      return {
        current: 0,
        total: 0,
        status: "idle" as RunStatus,
      };
    }

    // Count completed tasks
    const completedTasks = taskArray.filter(
      (task) => task.status === "complete"
    );
    const current = completedTasks.length;

    // Determine overall status
    let status: RunStatus;

    // Check for error tasks first
    if (taskArray.some((task) => task.status === "failed")) {
      status = "failed";
    }
    // Check if all tasks are complete
    else if (current === total) {
      status = "complete";
    }
    // Check if any tasks are running
    else if (taskArray.some((task) => task.status === "running")) {
      status = "running";
    }
    // Otherwise, tasks are idle
    else {
      status = "idle";
    }

    return {
      current,
      total,
      status,
    };
  }, [tasks]); // Only recalculate when tasks object reference changes
}
