import { useEffect, useCallback, useMemo } from 'react';
import { useTaskStore } from './use-task-store';
import type { WorkflowTaskSummary, WorkflowEvent } from '../types';

interface UseWorkflowTaskResult {
  task: WorkflowTaskSummary | null;
  events: WorkflowEvent[];
  isStreaming: boolean;
  stopStreaming: () => void;
  clearEvents: () => void;
}

export function useWorkflowTask(taskId: string, autoStream: boolean = true): UseWorkflowTaskResult {
  const task = useTaskStore(state => state.tasks[taskId] || null);
  const eventsRecord = useTaskStore(state => state.events);
  const subscribe = useTaskStore(state => state.subscribe);
  const unsubscribe = useTaskStore(state => state.unsubscribe);
  const isSubscribed = useTaskStore(state => state.isSubscribed);
  const clearEvents = useTaskStore(state => state.clearEvents);

  // Memoize events array to avoid creating new empty arrays
  const events = useMemo(() => {
    return eventsRecord[taskId] || [];
  }, [eventsRecord, taskId]);

  // Subscribe to streaming when task changes or on mount
  useEffect(() => {
    if (!task || !autoStream) return;
    if (task.status !== 'running') return;

    // Use store's subscribe method
    subscribe(taskId, task.deployment);

    // Cleanup when task is no longer running or component unmounts
    return () => {
      if (task.status !== 'running') {
        unsubscribe(taskId);
      }
    };
  }, [taskId, task, autoStream, subscribe, unsubscribe]);

  const stopStreaming = useCallback(() => {
    unsubscribe(taskId);
  }, [taskId, unsubscribe]);

  const clearTaskEvents = useCallback(() => {
    clearEvents(taskId);
  }, [taskId, clearEvents]);

  return {
    task,
    events,
    isStreaming: isSubscribed(taskId),
    stopStreaming,
    clearEvents: clearTaskEvents,
  };
}