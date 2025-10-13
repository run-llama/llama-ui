// Chat public API exports

// Components
export { default as ChatSection } from "./components/chat-section";
export { default as ChatInput } from "./components/chat-input";
export { default as ChatMessages } from "./components/chat-messages";
export { default as ChatMessage } from "./components/chat-message";
export { default as ChatCanvas } from "./components/canvas";

// Contexts and hooks for chat UI layer
export { ChatProvider, useChatUI } from "./components/chat.context";
export {
  ChatMessageProvider,
  useChatMessage,
  type ChatMessageContext,
} from "./components/chat-message.context";

// Types and interfaces
export type {
  ChatHandler,
  ChatContext,
  ChatRequestOptions,
  Message,
  MessageRoleType,
} from "./components/chat.interface";
export { MessageRole } from "./components/chat.interface";

// Message parts building blocks
export * from "./components/message-parts";

// Hooks (public only; exclude internal __ helpers)
export { useChat } from "./hooks/use-chat";
export type { UseChatOptions } from "./hooks/use-chat";
export { useChatStore } from "./hooks/use-chat-store";
export { useCopyToClipboard } from "./hooks/use-copy-to-clipboard";

// Widgets (markdown, sources, files, etc.)
export * from "./widgets";
