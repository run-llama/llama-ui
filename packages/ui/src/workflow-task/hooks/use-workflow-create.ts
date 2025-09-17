/**
 * useWorkflowTaskCreate Hook
 * Based on workflow-task-suite.md specifications
 */

import { useState, useCallback } from "react";
import { useHandlerStore } from "./use-handler-store";
import type { JSONValue, WorkflowHandlerSummary } from "../types";

interface UseWorkflowTaskCreateResult {
  createRun: (
    workflowName: string,
    input: JSONValue
  ) => Promise<WorkflowHandlerSummary>;
  isCreating: boolean;
  error: Error | null;
}

export function useWorkflowCreate(): UseWorkflowTaskCreateResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const storeCreateTask = useHandlerStore((state) => state.createHandler);

  const createRun = useCallback(
    async (
      workflowName: string,
      input: JSONValue
    ): Promise<WorkflowHandlerSummary> => {
      setIsCreating(true);
      setError(null);

      try {
        // Call store method to create task (handles API call and store update)
        const task = await storeCreateTask(workflowName, input);

        setIsCreating(false);
        return task;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsCreating(false);
        throw error;
      }
    },
    [storeCreateTask]
  );

  return {
    createRun: createRun,
    isCreating,
    error,
  };
}
