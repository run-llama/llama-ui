import { useState, useCallback } from "react";
import { useHandlerStore } from "./use-handler-store";
import type { JSONValue, WorkflowHandlerSummary } from "../types";

interface UseWorkflowRunResult {
  runWorkflow: (
    workflowName: string,
    input: JSONValue
  ) => Promise<WorkflowHandlerSummary>;
  isCreating: boolean;
  error: Error | null;
}

export function useWorkflowRun(): UseWorkflowRunResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const storeCreateHandler = useHandlerStore((state) => state.createHandler);

  const runWorkflow = useCallback(
    async (
      workflowName: string,
      input: JSONValue
    ): Promise<WorkflowHandlerSummary> => {
      setIsCreating(true);
      setError(null);

      try {
        // Call store method to create handler (handles API call and store update)
        const handler = await storeCreateHandler(workflowName, input);

        setIsCreating(false);
        return handler;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsCreating(false);
        throw error;
      }
    },
    [storeCreateHandler]
  );

  return {
    runWorkflow,
    isCreating,
    error,
  };
}
