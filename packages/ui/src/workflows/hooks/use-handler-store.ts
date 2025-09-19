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

/**
 * Test-only helper to reset the singleton store between tests.
 * @internal
 */
export function __resetHandlerStore() {
  globalStore = null;
}

/**
 * Test-only helper to imperatively update store state.
 * @internal
 */
export function __setHandlerStoreState(
  updater:
    | Partial<HandlerStoreState>
    | ((state: HandlerStoreState) => Partial<HandlerStoreState>)
) {
  if (!globalStore) {
    throw new Error("Handler store has not been initialized");
  }

  const nextState =
    typeof updater === "function" ? updater(globalStore.getState()) : updater;
  globalStore.setState(nextState, false);
}
