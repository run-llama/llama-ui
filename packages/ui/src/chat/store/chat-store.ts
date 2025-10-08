/**
 * Chat Store Implementation
 * Zustand store for managing chat sessions with workflow integration
 * Pattern: Similar to workflows/store/handler-store.ts
 */

import { create } from "zustand";
import type { Client as LlamaDeployClient } from "@llamaindex/workflows-client";
import type { Message, ChatRequestOptions } from "../components/chat.interface";
import { MessageRole } from "../components/chat.interface";
import type { MessagePart } from "../components/message-parts/types";
import type { WorkflowEvent } from "../../workflows/types";
import type {
  ChatSession,
  CreateSessionOptions,
  ChatStoreState,
} from "./types";
import {
  createChatHandler,
  sendEventToHandler,
  subscribeToHandlerEvents,
  unsubscribeFromHandler,
} from "./helper";
import { messageToEvent, isMessageTerminator } from "./adapters";
import { StreamingMessage } from "./streaming-message";

export type { ChatStoreState, ChatSession, CreateSessionOptions };

/**
 * Create a chat store instance with injected client
 * Uses constructor pattern for dependency injection
 */
export const createChatStore = (client: LlamaDeployClient) =>
  create<ChatStoreState>()((set, get) => ({
    // Initial state
    sessions: {},

    // Session management
    createSession: async (options: CreateSessionOptions) => {
      const {
        workflowName,
        handlerId: providedHandlerId,
        initialMessages = [],
        indexName,
      } = options;

      // Create handler if not provided
      const handlerId =
        providedHandlerId || (await createChatHandler(client, workflowName, indexName));

      // Initialize session
      const session: ChatSession = {
        handlerId,
        workflowName,
        indexName,
        messages: initialMessages,
        status: "ready",
        error: null,
        streamingMessage: null,
      };

      set((state) => ({
        sessions: { ...state.sessions, [handlerId]: session },
      }));

      // Note: Don't auto-subscribe here to avoid connection limit issues
      // Subscription should be controlled externally (e.g., by ChatHistorySidebar)
      // Only the currently active chat should maintain an SSE connection

      return handlerId;
    },

    deleteSession: (handlerId: string) => {
      // Unsubscribe from events
      unsubscribeFromHandler(handlerId);

      // Remove session
      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [handlerId]: _, ...remainingSessions } = state.sessions;
        return { sessions: remainingSessions };
      });
    },

    getSession: (handlerId: string) => {
      return get().sessions[handlerId];
    },

    // Message operations
    sendMessage: async (
      handlerId: string,
      message: Message,
      _opts?: ChatRequestOptions
    ) => {
      const session = get().sessions[handlerId];
      if (!session) {
        throw new Error(`Session ${handlerId} not found`);
      }

      // Add user message to session
      get()._appendMessage(handlerId, message);

      // Create placeholder assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: MessageRole.Assistant,
        parts: [],
      };
      get()._appendMessage(handlerId, assistantMessage);

      // Set streaming state and create new StreamingMessage instance
      get().setStatus(handlerId, "submitted");
      get()._setStreamingMessage(
        handlerId,
        new StreamingMessage(assistantMessageId)
      );

      try {
        // Convert message to workflow event and send
        const event = messageToEvent(message);
        await sendEventToHandler(client, handlerId, event);

        // Update status to streaming (waiting for events)
        get().setStatus(handlerId, "streaming");
      } catch (error) {
        get().setError(handlerId, error as Error);
        get().setStatus(handlerId, "error");
        throw error;
      }
    },

    setMessages: (handlerId: string, messages: Message[]) => {
      set((state) => {
        const session = state.sessions[handlerId];
        if (!session) return state;

        return {
          sessions: {
            ...state.sessions,
            [handlerId]: { ...session, messages },
          },
        };
      });
    },

    _appendMessage: (handlerId: string, message: Message) => {
      set((state) => {
        const session = state.sessions[handlerId];
        if (!session) return state;

        return {
          sessions: {
            ...state.sessions,
            [handlerId]: {
              ...session,
              messages: [...session.messages, message],
            },
          },
        };
      });
    },

    _updateAssistantMessage: (
      handlerId: string,
      messageId: string,
      parts: MessagePart[]
    ) => {
      set((state) => {
        const session = state.sessions[handlerId];
        if (!session) return state;

        const updatedMessages = session.messages.map((msg) =>
          msg.id === messageId ? { ...msg, parts } : msg
        );

        return {
          sessions: {
            ...state.sessions,
            [handlerId]: { ...session, messages: updatedMessages },
          },
        };
      });
    },

    // Status management
    setStatus: (handlerId: string, status: ChatSession["status"]) => {
      set((state) => {
        const session = state.sessions[handlerId];
        if (!session) return state;

        return {
          sessions: {
            ...state.sessions,
            [handlerId]: { ...session, status },
          },
        };
      });
    },

    setError: (handlerId: string, error: Error | null) => {
      set((state) => {
        const session = state.sessions[handlerId];
        if (!session) return state;

        return {
          sessions: {
            ...state.sessions,
            [handlerId]: { ...session, error },
          },
        };
      });
    },

    // Internal helper for setting streamingMessage
    _setStreamingMessage: (
      handlerId: string,
      streamingMessage: StreamingMessage | null
    ) => {
      set((state) => {
        const session = state.sessions[handlerId];
        if (!session) return state;

        return {
          sessions: {
            ...state.sessions,
            [handlerId]: { ...session, streamingMessage },
          },
        };
      });
    },

    // Streaming control
    stop: async (handlerId: string) => {
      const session = get().sessions[handlerId];
      if (!session) {
        throw new Error(`Session ${handlerId} not found`);
      }

      // Complete current streaming message if exists
      if (session.streamingMessage) {
        session.streamingMessage.complete();
      }

      // Unsubscribe from streaming
      unsubscribeFromHandler(handlerId);

      // Update status and clear streaming state
      get().setStatus(handlerId, "ready");
      get()._setStreamingMessage(handlerId, null);

      // Note: No backend cancel API exists yet, this is client-side only
    },

    regenerate: async (handlerId: string, messageId?: string) => {
      const session = get().sessions[handlerId];
      if (!session) {
        throw new Error(`Session ${handlerId} not found`);
      }

      // Find the message to regenerate (last user message if not specified)
      let targetIndex = -1;
      if (messageId) {
        targetIndex = session.messages.findIndex((m) => m.id === messageId);
      } else {
        // Find last user message
        for (let i = session.messages.length - 1; i >= 0; i--) {
          if (session.messages[i].role === "user") {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex === -1) {
        throw new Error("No message found to regenerate");
      }

      // Remove messages after target (including old assistant response)
      const messagesToKeep = session.messages.slice(0, targetIndex + 1);
      get().setMessages(handlerId, messagesToKeep);

      // Create new assistant placeholder without re-adding user message
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: MessageRole.Assistant,
        parts: [],
      };
      get()._appendMessage(handlerId, assistantMessage);

      // Set streaming state and create new StreamingMessage instance
      get().setStatus(handlerId, "submitted");
      get()._setStreamingMessage(
        handlerId,
        new StreamingMessage(assistantMessageId)
      );

      try {
        // Send the user message as event (without adding to messages again)
        const messageToResend = session.messages[targetIndex];
        const event = messageToEvent(messageToResend);
        await sendEventToHandler(client, handlerId, event);

        // Update status to streaming
        get().setStatus(handlerId, "streaming");
      } catch (error) {
        get().setError(handlerId, error as Error);
        get().setStatus(handlerId, "error");
        throw error;
      }
    },
  }));
