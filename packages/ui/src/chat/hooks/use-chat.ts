/**
 * useChat Hook - Bridge Chat UI to Workflow
 * Implements ChatHandler interface backed by Zustand store
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Message,
  ChatRequestOptions,
  ChatHandler,
} from "../components/chat.interface";
import { useChatStore } from "./use-chat-store";

export interface UseChatOptions {
  /**
   * Workflow name to use for this chat session
   */
  workflowName: string;

  /**
   * Index name to use for this chat session
   */
  indexName?: string;

  /**
   * Optional handler ID to reuse existing session
   * If not provided, a new session will be created
   */
  handlerId?: string;

  /**
   * Optional initial messages to populate the chat
   */
  initialMessages?: Message[];

  /**
   * Callback when chat session is initialized and handlerId is available
   * - If handlerId is provided: fires on mount
   * - If no handlerId: fires when first message is sent (lazy initialization)
   */
  onReady?: (handlerId: string) => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * Hook to manage a chat session as a workflow
 *
 * Session initialization is eager by default - the session is created on mount.
 * If you provide a handlerId, the session will reuse that session when available.
 *
 * @example
 * ```tsx
 * // Lazy initialization - session created on first message
 * function MyChat() {
 *   const chat = useChat({
 *     workflowName: "my-chat-workflow",
 *     indexName: "my-index",
 *     onReady: (handlerId) => {
 *       // Called when first message is sent
 *       console.log("Chat ready:", handlerId);
 *     },
 *   });
 *
 *   return <ChatSection handler={chat} />;
 * }
 *
 * // Eager initialization - session created on mount
 * function MyResumableChat() {
 *   const chat = useChat({
 *     workflowName: "my-chat-workflow",
 *     handlerId: "existing-session-123",
 *     indexName: "my-index",
 *     onReady: (handlerId) => {
 *       // Called immediately on mount
 *       console.log("Chat ready:", handlerId);
 *     },
 *   });
 *
 *   return <ChatSection handler={chat} />;
 * }
 * ```
 */
export function useChat(
  options: UseChatOptions
): ChatHandler & { handlerId: string | null } {
  const {
    workflowName,
    indexName,
    handlerId: providedHandlerId,
    initialMessages,
    onReady,
    onError,
  } = options;

  const store = useChatStore();
  const sessions = useChatStore((state) => state.sessions);

  // Track the handler ID for this hook instance
  const [handlerId, setHandlerId] = useState<string | null>(
    providedHandlerId || null
  );

  // Get session from store
  const session = useChatStore((state) =>
    handlerId ? state.sessions[handlerId] : undefined
  );

  // Shared session initialization logic with reuse semantics handled in the hook
  const initSession = useCallback(async () => {
    // 1) If provided handlerId exists in store, reuse it
    if (providedHandlerId) {
      const existing = sessions[providedHandlerId];
      if (existing) {
        setHandlerId(providedHandlerId);
        return providedHandlerId;
      }
    }

    // 2) Create new session
    const id = await store.createSession({
      workflowName,
      handlerId: providedHandlerId,
      initialMessages,
      indexName,
    });
    setHandlerId(id);
    onReady?.(id);
    return id;
  }, [workflowName, providedHandlerId, initialMessages, store, onReady, indexName, sessions]);

  // Eager initialization on mount and when core identifiers change
  useEffect(() => {
    initSession().catch((error) => {
      onError?.(error as Error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowName, indexName, providedHandlerId]);

  // Report errors from store
  useEffect(() => {
    if (session?.error) {
      onError?.(session.error);
    }
  }, [session?.error, onError]);

  // Memoized handler functions
  const sendMessage = useCallback(
    async (message: Message, opts?: ChatRequestOptions) => {
      const currentHandlerId = handlerId;
      if (!currentHandlerId) {
        throw new Error("Chat session not initialized");
      }
      await store.sendMessage(currentHandlerId, message, opts);
    },
    [handlerId, store]
  );

  const stop = useCallback(async () => {
    if (!handlerId) return;
    await store.stop(handlerId);
  }, [handlerId, store]);

  const regenerate = useCallback(
    async (opts?: { messageId?: string } & ChatRequestOptions) => {
      if (!handlerId) {
        throw new Error("Cannot regenerate: no messages sent yet");
      }
      await store.regenerate(handlerId, opts?.messageId);
    },
    [handlerId, store]
  );

  const setMessages = useCallback(
    (messages: Message[]) => {
      if (!handlerId) return;
      store.setMessages(handlerId, messages);
    },
    [handlerId, store]
  );

  // Return ChatHandler-compatible object
  return useMemo(
    () => ({
      handlerId,
      indexName,
      messages: session?.messages || [],
      status: session?.status || (handlerId ? "ready" : "idle"),
      sendMessage,
      stop,
      regenerate,
      setMessages,
    }),
    [
      handlerId,
      indexName,
      session?.messages,
      session?.status,
      sendMessage,
      stop,
      regenerate,
      setMessages,
    ]
  );
}

// Re-export for convenience
export { useChatStore } from "./use-chat-store";
