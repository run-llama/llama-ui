/**
 * useChat Hook - Bridge Chat UI to Workflow
 * Implements ChatHandler interface backed by Zustand store
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Message, ChatRequestOptions, ChatHandler } from "../components/chat.interface";
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
   * Callback when chat is ready and handlerId is available
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
 * @example
 * ```tsx
 * function MyChat() {
 *   const chat = useChat({
 *     workflowName: "my-chat-workflow",
 *     onReady: (handlerId) => console.log("Chat ready:", handlerId),
 *   });
 * 
 *   return <ChatSection handler={chat} />;
 * }
 * ```
 */
export function useChat(options: UseChatOptions): ChatHandler & { handlerId: string | null } {
  const { workflowName, handlerId: providedHandlerId, initialMessages, onReady, onError } = options;

  const store = useChatStore();

  // Track the handler ID for this hook instance
  const [handlerId, setHandlerId] = useState<string | null>(providedHandlerId || null);

  // Get session from store
  const session = useChatStore((state) => handlerId ? state.sessions[handlerId] : undefined);

  // Initialize session if providedHandlerId is given
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const id = await store.createSession({
          workflowName,
          handlerId: providedHandlerId,
          initialMessages,
        });

        if (mounted) {
          setHandlerId(id);
          onReady?.(id);
        }
      } catch (error) {
        if (mounted) {
          onError?.(error as Error);
        }
      }
    }

    // Only create if a specific handler ID is provided
    if (providedHandlerId && !session) {
      initSession();
    }

    return () => {
      mounted = false;
      // Clean up session on unmount
      if (handlerId) {
        store.deleteSession(handlerId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

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
          currentHandlerId = await store.createSession({
            workflowName,
            handlerId: providedHandlerId,
            initialMessages,
          });
          setHandlerId(currentHandlerId);
          onReady?.(currentHandlerId);
        } catch (error) {
          onError?.(error as Error);
          throw error;
        }
      }
      
      await store.sendMessage(currentHandlerId, message, opts);
    },
    [handlerId, workflowName, providedHandlerId, initialMessages, store, onReady, onError]
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
      status: session?.status || "ready",
      sendMessage,
      stop,
      regenerate,
      setMessages,
    }),
    [handlerId, session?.messages, session?.status, sendMessage, stop, regenerate, setMessages]
  );
}

// Re-export for convenience
export { useChatStore } from "./use-chat-store";
