/**
 * useWorkflowTaskList Hook
 * Based on workflow-task-suite.md specifications
 */

import { useEffect, useMemo } from 'react';
import { useTaskStore } from '../store/task-store';
import type { WorkflowTaskSummary } from '../types';

interface UseWorkflowTaskListResult {
  tasks: WorkflowTaskSummary[];
  clearCompleted: () => void;
}

export function useWorkflowTaskList(deployment?: string): UseWorkflowTaskListResult {
  // Use stable selector that only depends on tasks object reference
  const tasksRecord = useTaskStore(state => state.tasks);
  const clearCompleted = useTaskStore(state => state.clearCompleted);
  const subscribe = useTaskStore(state => state.subscribe);

  // Memoize tasks array and filtering based on tasksRecord
  const { allTasks, filteredTasks } = useMemo(() => {
    const allTasks = Object.values(tasksRecord);
    const filteredTasks = allTasks.filter(task => 
      !deployment || task.deployment === deployment
    );
    return { allTasks, filteredTasks };
  }, [tasksRecord, deployment]);

  // Auto-subscribe to running tasks for streaming
  useEffect(() => {
    const runningTasks = allTasks.filter(task => 
      task.status === 'running' && (!deployment || task.deployment === deployment)
    );
    
    runningTasks.forEach(task => {
      // Use store's subscribe method to handle streaming
      subscribe(task.task_id, task.deployment);
    });

    // Note: No cleanup needed here because SharedStreamingManager handles 
    // connection sharing and cleanup automatically
  }, [allTasks, deployment, subscribe]);

  return {
    tasks: filteredTasks,
    clearCompleted,
  };
}