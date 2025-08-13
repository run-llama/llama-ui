import { useEffect, useCallback, useMemo, useRef } from "react";
import { useTaskStore } from "./use-task-store";
import type { WorkflowTaskSummary, WorkflowEvent } from "../types";

interface UseWorkflowTaskResult {
  task: WorkflowTaskSummary | null;
  events: WorkflowEvent[];
  isStreaming: boolean;
  stopStreaming: () => void;
  clearEvents: () => void;
}

export interface UseWorkflowTaskOptions {
  taskId?: string;
  autoStream?: boolean;
  onTaskResult?: (task: WorkflowTaskSummary) => void;
}

export function useWorkflowTask({
  taskId,
  autoStream = true,
  onTaskResult,
}: UseWorkflowTaskOptions = {}): UseWorkflowTaskResult {
  const task = useTaskStore((state) =>
    taskId ? state.tasks[taskId] || null : null
  );
  const eventsRecord = useTaskStore((state) => state.events);
  const subscribe = useTaskStore((state) => state.subscribe);
  const unsubscribe = useTaskStore((state) => state.unsubscribe);
  const isSubscribed = useTaskStore((state) => state.isSubscribed);
  const clearEvents = useTaskStore((state) => state.clearEvents);

  // Memoize events array to avoid creating new empty arrays
  const events = useMemo(() => {
    return taskId ? eventsRecord[taskId] || [] : [];
  }, [eventsRecord, taskId]);

  // Subscribe to streaming when task changes or on mount
  useEffect(() => {
    if (!task || !autoStream || !taskId) return;
    if (task.status !== "running") return;

    // Use store's subscribe method
    subscribe(taskId, task.deployment);

    // Cleanup when task is no longer running or component unmounts
    return () => {
      if (task.status !== "running") {
        unsubscribe(taskId);
      }
    };
  }, [taskId, task, autoStream, subscribe, unsubscribe]);

  const stopStreaming = useCallback(() => {
    if (taskId) {
      unsubscribe(taskId);
    }
  }, [taskId, unsubscribe]);

  const clearTaskEvents = useCallback(() => {
    if (taskId) {
      clearEvents(taskId);
    }
  }, [taskId, clearEvents]);

  const lastStatus = useRef(task?.status);
  useEffect(() => {
    if (
      task &&
      lastStatus.current !== task.status &&
      task.status === "complete" &&
      onTaskResult
    ) {
      try {
        onTaskResult(task);
      } catch (error) {
        console.error("Error calling onTaskResult", error);
      }
    }
    lastStatus.current = task?.status;
  }, [task, onTaskResult, taskId]);

  return {
    task,
    events,
    isStreaming: taskId ? isSubscribed(taskId) : false,
    stopStreaming,
    clearEvents: clearTaskEvents,
  };
}
