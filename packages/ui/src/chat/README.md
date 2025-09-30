# useChat Hook - Workflow as a Chat

Bridge your chat UI to LlamaIndex workflows with the `useChat` hook.

## Quick Start

```tsx
import { useChat } from "@llamaindex/ui";
import { ChatSection } from "@llamaindex/ui/chat";

function MyChat() {
  const chat = useChat({
    workflowName: "my-chat-workflow",
    onReady: (handlerId) => console.log("Chat ready:", handlerId),
    onError: (error) => console.error("Chat error:", error),
  });

  return <ChatSection handler={chat} />;
}
```

## Features

- ✅ **Automatic session management**: Creates and manages workflow handlers
- ✅ **Real-time streaming**: Subscribes to workflow events and updates messages
- ✅ **Message conversion**: Adapts between chat messages and workflow events
- ✅ **Error handling**: Graceful error recovery and status management
- ✅ **Zustand store**: Centralized state management for scalability
- ✅ **TypeScript**: Fully typed API

## API

### `useChat(options)`

Creates a chat session backed by a workflow handler.

**Options:**
- `workflowName` (string): Required. Name of the workflow to use
- `handlerId` (string, optional): Reuse existing session
- `initialMessages` (Message[], optional): Pre-populate chat
- `onReady` ((handlerId: string) => void, optional): Callback when ready
- `onError` ((error: Error) => void, optional): Error callback

**Returns:**
```typescript
{
  handlerId: string | null;
  messages: Message[];
  status: "submitted" | "streaming" | "ready" | "error";
  sendMessage: (msg: Message, opts?: ChatRequestOptions) => Promise<void>;
  stop: () => Promise<void>;
  regenerate: (opts?: { messageId?: string }) => Promise<void>;
  setMessages: (messages: Message[]) => void;
}
```

### `useChatStore()`

Direct access to the chat Zustand store. Useful for advanced use cases.

```tsx
const store = useChatStore();
const session = useChatStore(state => state.sessions[handlerId]);
```

**Note on Internal Methods:**
- Methods prefixed with `_` (e.g., `_appendMessage`, `_updateAssistantMessage`) are internal-only
- These bypass backend sync and can cause FE/BE inconsistency
- Use public methods (`sendMessage`, `setMessages`) for normal operations
- Internal methods are used by the store itself for controlled operations

## Message Parts Protocol

The chat supports **rich message parts** beyond plain text (citations, files, events, etc.). The LLM backend must emit structured data using our **XML-based protocol**.

📋 **Full Protocol Spec**: See [`/specs/001-use-chat/CHAT_PROTOCOL.md`](../../../specs/001-use-chat/CHAT_PROTOCOL.md)  
⚡ **Quick Reference**: See [`/specs/001-use-chat/PROTOCOL_QUICKREF.md`](../../../specs/001-use-chat/PROTOCOL_QUICKREF.md)

**Supported Part Types:**
- 📝 **Text** - Markdown content (default)
- 📚 **Sources** - Citations with hover cards (`<sources>`)
- ❓ **Suggested Questions** - Follow-up question chips (`<suggested_questions>`)
- 📎 **Files** - File attachments (`<file>`)
- 📄 **Artifacts** - Documents in canvas (`<artifact>`)
- ⚡ **Events** - Status/progress indicators (`<event>`)

**Example LLM Output:**
```
Based on research, climate change is accelerating.

<sources>
{"nodes": [{"id": "1", "text": "...", "url": "...", "metadata": {...}}]}
</sources>

<suggested_questions>
["What causes this?", "How to mitigate?"]
</suggested_questions>
```

**Status**: 
- ✅ Protocol defined
- 🚧 Parser implementation pending
- ⏳ Backend integration awaiting

---

## Architecture

The `useChat` hook follows a store-first architecture:

1. **Chat Store** (`chat-store.ts`): Zustand store with business logic
2. **Helpers** (`helper.ts`): Workflow client integration
3. **Adapters** (`adapters.ts`): Message ↔ Event conversion
4. **Hook** (`use-chat.ts`): Thin React wrapper around store

## Message ↔ Event Flow

**Sending a message:**
1. User message → `sendMessage()`
2. Adapter converts to `WorkflowEvent`
3. Event sent to workflow handler
4. Assistant message placeholder created

**Receiving events:**
1. Workflow streams events
2. Adapter converts events to `MessagePart[]`
3. Assistant message parts updated in real-time
4. StopEvent signals completion

## Advanced Usage

### Multiple Chats

```tsx
function MultiChatApp() {
  const chat1 = useChat({ workflowName: "assistant-1" });
  const chat2 = useChat({ workflowName: "assistant-2" });
  
  return (
    <>
      <ChatSection handler={chat1} />
      <ChatSection handler={chat2} />
    </>
  );
}
```

### Custom Message Handling

```tsx
const chat = useChat({
  workflowName: "my-workflow",
  onReady: (handlerId) => {
    // Access store directly for advanced control
    const store = useChatStore();
    store.setMessages(handlerId, customMessages);
  },
});
```

## Testing

Unit tests for adapters:
```bash
pnpm test packages/ui/tests/chat/adapters.test.ts
```

## See Also

- [Storybook Examples](../../stories/chat/)
- [ChatSection Component](./components/chat-section.tsx)
- [Workflow Store](../workflows/store/)
