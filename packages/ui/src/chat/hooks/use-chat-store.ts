/**
 * Chat Store Hook with Auto-Singleton Pattern
 * Provides both selector API and direct store access
 * Pattern: Similar to workflows/hooks/use-handler-store.ts
 */

import { useMemo } from "react";
import { useWorkflowsClient } from "../../lib/api-provider";
import { createChatStore } from "../store/chat-store";
import type { ChatStoreState } from "../store/types";

// Global singleton store instance
let globalStore: ReturnType<typeof createChatStore> | null = null;

// Overloaded function signatures for different use cases
export function useChatStore(): ChatStoreState;
export function useChatStore<T>(
  selector: (state: ChatStoreState) => T
): T;

/**
 * Hook to access the chat store
 * Automatically creates a singleton store instance
 * No ApiProvider registration needed!
 * 
 * @example
 * // Get full state
 * const chatState = useChatStore();
 * 
 * @example
 * // Use selector for specific data
 * const session = useChatStore(state => state.sessions[handlerId]);
 */
export function useChatStore<T>(selector?: (state: ChatStoreState) => T) {
  const client = useWorkflowsClient();

  // Create store instance once and reuse (singleton pattern)
  const store = useMemo(() => {
    if (!globalStore) {
      globalStore = createChatStore(client);
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
export function __resetChatStore() {
  globalStore = null;
}

/**
 * Test-only helper to imperatively update store state.
 * @internal
 */
export function __setChatStoreState(
  updater:
    | Partial<ChatStoreState>
    | ((state: ChatStoreState) => Partial<ChatStoreState>)
) {
  if (!globalStore) {
    throw new Error("Chat store has not been initialized");
  }

  const nextState =
    typeof updater === "function" ? updater(globalStore.getState()) : updater;
  globalStore.setState(nextState, false);
}
