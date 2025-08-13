/**
 * useWorkflowTaskList Hook
 * Based on workflow-task-suite.md specifications
 */

import { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from './use-task-store';
import { useDeployment } from '../../lib/api-provider';
import type { WorkflowTaskSummary } from '../types';

interface UseWorkflowTaskListResult {
  tasks: WorkflowTaskSummary[];
  clearCompleted: () => void;
  loading: boolean;
  error: string | null;
}

export function useWorkflowTaskList(): UseWorkflowTaskListResult {
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
        setError(err instanceof Error ? err.message : 'Failed to sync with server');
      } finally {
        setLoading(false);
      }
    }
    
    syncWithServer();
  }, [deployment, sync]);

  // Memoize tasks array and filtering based on tasksRecord
  const filteredTasks = useMemo(() => {
    const allTasks = Object.values(tasksRecord);
    return allTasks.filter(task => 
      task.deployment === deployment
    );
  }, [tasksRecord, deployment]);

  return {
    tasks: filteredTasks,
    clearCompleted,
    loading,
    error,
  };
}
