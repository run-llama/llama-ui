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
 * Session initialization is lazy by default - the session is created when the first message is sent.
 * If you provide a handlerId, the session is initialized immediately on mount.
 *
 * @example
 * ```tsx
 * // Lazy initialization - session created on first message
 * function MyChat() {
 *   const chat = useChat({
 *     workflowName: "my-chat-workflow",
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
    handlerId: providedHandlerId,
    initialMessages,
    onReady,
    onError,
  } = options;

  const store = useChatStore();

  // Track the handler ID for this hook instance
  const [handlerId, setHandlerId] = useState<string | null>(
    providedHandlerId || null
  );

  // Get session from store
  const session = useChatStore((state) =>
    handlerId ? state.sessions[handlerId] : undefined
  );

  // Shared session initialization logic
  const initSession = useCallback(async () => {
    const id = await store.createSession({
      workflowName,
      handlerId: providedHandlerId,
      initialMessages,
    });
    setHandlerId(id);
    onReady?.(id);
    return id;
  }, [workflowName, providedHandlerId, initialMessages, store, onReady]);

  // Eager initialization: only if providedHandlerId is given
  // Otherwise, lazy initialization happens in sendMessage on first message
  useEffect(() => {
    if (providedHandlerId && !session) {
      initSession().catch((error) => {
        onError?.(error as Error);
      });
    }
  }, [providedHandlerId, session, initSession, onError]);

  // Report errors from store
  useEffect(() => {
    if (session?.error) {
      onError?.(session.error);
    }
  }, [session?.error, onError]);

  // Memoized handler functions
  const sendMessage = useCallback(
    async (message: Message, opts?: ChatRequestOptions) => {
      let currentHandlerId = handlerId;

      // Lazy initialization: create session on first message if not exists
      if (!currentHandlerId) {
        try {
          currentHandlerId = await initSession();
        } catch (error) {
          onError?.(error as Error);
          throw error;
        }
      }

      await store.sendMessage(currentHandlerId, message, opts);
    },
    [handlerId, initSession, store, onError]
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
      messages: session?.messages || [],
      status: session?.status || (handlerId ? "ready" : "idle"),
      sendMessage,
      stop,
      regenerate,
      setMessages,
    }),
    [
      handlerId,
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
