/**
 * Task Store Hook that uses client from context
 * Provides both selector API and direct store access
 */

import { useMemo } from "react";
import { useWorkflowsClient } from "../../lib/api-provider";
import { createHandlerStore } from "../store/handler-store";
import type { HandlerStoreState } from "../store/handler-store";

// Simple global store instance
let globalStore: ReturnType<typeof createHandlerStore> | null = null;

// Overloaded function signatures for different use cases
export function useHandlerStore(): HandlerStoreState;
export function useHandlerStore<T>(
  selector: (state: HandlerStoreState) => T
): T;

export function useHandlerStore<T>(selector?: (state: HandlerStoreState) => T) {
  const client = useWorkflowsClient();

  // Create store instance once and reuse
  const store = useMemo(() => {
    if (!globalStore) {
      globalStore = createHandlerStore(client);
    }
    return globalStore;
  }, [client]);

  // If selector is provided, use it; otherwise return the full state
  return selector ? store(selector) : store();
}
