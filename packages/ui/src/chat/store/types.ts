/**
 * Chat Store Types
 * Based on contracts/chat-store.contract.ts
 */

import type { Message, ChatRequestOptions } from "../components/chat.interface";
import type { MessagePart } from "../components/message-parts/types";
import type { StreamingMessage } from "./streaming-message";

/**
 * Chat session state
 * 
 * NOTE: sessionId conceptually equals handlerId
 * One chat session = one handler
 * (run_id exists in telemetry but not tracked in state)
 */
export interface ChatSession {
  handlerId: string;           // Unique handler identifier (= sessionId)
  workflowName: string;
  messages: Message[];
  status: "submitted" | "streaming" | "ready" | "error";
  error: Error | null;
  streamingMessage: StreamingMessage | null; // Event accumulator for current streaming message (contains messageId)
}

/**
 * Options for creating a chat session
 */
export interface CreateSessionOptions {
  workflowName: string;
  handlerId?: string;
  initialMessages?: Message[];
}

/**
 * Chat store state and actions
 */
export interface ChatStoreState {
  // State (key = handlerId, which conceptually = sessionId)
  sessions: Record<string, ChatSession>;
  
  // Session management
  createSession(options: CreateSessionOptions): Promise<string>; // Returns handlerId
  deleteSession(handlerId: string): void;
  getSession(handlerId: string): ChatSession | undefined;
  
  // Message operations (public)
  sendMessage(handlerId: string, message: Message, opts?: ChatRequestOptions): Promise<void>;
  setMessages(handlerId: string, messages: Message[]): void;
  
  // Internal message operations (use underscore prefix)
  _appendMessage(handlerId: string, message: Message): void;
  _updateAssistantMessage(handlerId: string, messageId: string, parts: MessagePart[]): void;
  
  // Status management
  setStatus(handlerId: string, status: ChatSession["status"]): void;
  setError(handlerId: string, error: Error | null): void;
  
  // Streaming control
  stop(handlerId: string): Promise<void>;
  regenerate(handlerId: string, messageId?: string): Promise<void>;
  
  // Internal helpers (use underscore prefix)
  _setStreamingMessage(handlerId: string, streamingMessage: StreamingMessage | null): void;
}
