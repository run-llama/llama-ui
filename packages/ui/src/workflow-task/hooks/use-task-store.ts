/**
 * Task Store Hook that uses client from context
 * Provides both selector API and direct store access
 */

import { useMemo } from "react";
import { useLlamaDeployClient } from "../../lib/api-provider";
import { createTaskStore } from "../store/task-store";
import type { TaskStoreState } from "../store/task-store";

// Simple global store instance
let globalStore: ReturnType<typeof createTaskStore> | null = null;

// Overloaded function signatures for different use cases
export function useTaskStore(): TaskStoreState;
export function useTaskStore<T>(selector: (state: TaskStoreState) => T): T;

export function useTaskStore<T>(selector?: (state: TaskStoreState) => T) {
  const client = useLlamaDeployClient();

  // Create store instance once and reuse
  const store = useMemo(() => {
    if (!globalStore) {
      globalStore = createTaskStore(client);
    }
    return globalStore;
  }, [client]);

  // If selector is provided, use it; otherwise return the full state
  return selector ? store(selector) : store();
}
