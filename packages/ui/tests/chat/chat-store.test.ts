/**
 * Chat Store Tests
 * Based on contracts/chat-store.contract.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Client } from "@llamaindex/workflows-client";
import { createChatStore } from "../../src/chat/store/chat-store";
import type { Message } from "../../src/chat/components/chat.interface";

// Mock the workflow client
const createMockClient = (): Client => {
  return {
    baseUrl: "http://localhost:8000",
    fetch: vi.fn(),
  } as unknown as Client;
};

// Mock the helper functions
vi.mock("../../src/chat/store/helper", () => ({
  createChatHandler: vi.fn(async () => "mock-handler-id"),
  sendEventToHandler: vi.fn(async () => {}),
  subscribeToHandlerEvents: vi.fn(() => () => {}),
  unsubscribeFromHandler: vi.fn(),
}));

describe("Chat Store - Session Management", () => {
  let client: Client;
  let store: ReturnType<typeof createChatStore>;

  beforeEach(() => {
    client = createMockClient();
    store = createChatStore(client);
    vi.clearAllMocks();
  });

  // CS-001: Create session
  it("should create a new session and return handlerId", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    expect(handlerId).toBeDefined();
    expect(typeof handlerId).toBe("string");

    const session = store.getState().sessions[handlerId];
    expect(session).toBeDefined();
    expect(session.workflowName).toBe("chat_agent");
    expect(session.status).toBe("ready");
    expect(session.messages).toEqual([]);
    expect(session.error).toBeNull();
    expect(session.streamingMessage).toBeNull();
  });

  // CS-002: Create session with handlerId
  it("should create session with provided handlerId", async () => {
    const providedHandlerId = "handler-123";
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
      handlerId: providedHandlerId,
    });

    expect(handlerId).toBe(providedHandlerId);
    const session = store.getState().sessions[providedHandlerId];
    expect(session).toBeDefined();
    expect(session.handlerId).toBe(providedHandlerId);
  });

  // CS-003: Create session with initialMessages
  it("should create session with initial messages", async () => {
    const initialMessages: Message[] = [
      { id: "msg-1", role: "user", parts: [{ type: "text", text: "Hello" }] },
      {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi there!" }],
      },
    ];

    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
      initialMessages,
    });

    const session = store.getState().sessions[handlerId];
    expect(session.messages).toEqual(initialMessages);
  });

  // CS-004: Delete session
  it("should delete a session", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    expect(store.getState().sessions[handlerId]).toBeDefined();

    store.getState().deleteSession(handlerId);

    expect(store.getState().sessions[handlerId]).toBeUndefined();
  });

  // CS-007: Get session
  it("should get session by handlerId", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    const session = store.getState().getSession(handlerId);
    expect(session).toBeDefined();
    expect(session?.handlerId).toBe(handlerId);
  });

  // CS-008: Get non-existent session
  it("should return undefined for non-existent session", () => {
    const session = store.getState().getSession("non-existent");
    expect(session).toBeUndefined();
  });
});

describe("Chat Store - Message Operations", () => {
  let client: Client;
  let store: ReturnType<typeof createChatStore>;

  beforeEach(() => {
    client = createMockClient();
    store = createChatStore(client);
    vi.clearAllMocks();
  });

  // CS-009: setMessages
  it("should set messages for a session", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    const newMessages: Message[] = [
      { id: "msg-1", role: "user", parts: [{ type: "text", text: "Hello" }] },
    ];

    store.getState().setMessages(handlerId, newMessages);

    const session = store.getState().sessions[handlerId];
    expect(session.messages).toEqual(newMessages);
  });

  // CS-010: _appendMessage (internal use only)
  it("should append a message to existing messages", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
      initialMessages: [
        { id: "msg-1", role: "user", parts: [{ type: "text", text: "Hello" }] },
      ],
    });

    const newMessage: Message = {
      id: "msg-2",
      role: "assistant",
      parts: [{ type: "text", text: "Hi!" }],
    };

    store.getState()._appendMessage(handlerId, newMessage);

    const session = store.getState().sessions[handlerId];
    expect(session.messages).toHaveLength(2);
    expect(session.messages[1]).toEqual(newMessage);
  });

  // CS-011: _updateAssistantMessage (internal use only)
  it("should update assistant message parts", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
      initialMessages: [
        { id: "msg-1", role: "user", parts: [{ type: "text", text: "Hello" }] },
        {
          id: "msg-2",
          role: "assistant",
          parts: [{ type: "text", text: "Hi" }],
        },
      ],
    });

    const updatedParts = [
      { type: "text" as const, text: "Hi there! How can I help?" },
    ];
    store.getState()._updateAssistantMessage(handlerId, "msg-2", updatedParts);

    const session = store.getState().sessions[handlerId];
    const assistantMsg = session.messages.find((m) => m.id === "msg-2");
    expect(assistantMsg?.parts).toEqual(updatedParts);
  });

  // CS-012: sendMessage creates assistant placeholder (calls _appendMessage internally)
  it("should create assistant placeholder when sending message", async () => {
    const { sendEventToHandler } = await import("../../src/chat/store/helper");

    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    const userMessage: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    await store.getState().sendMessage(handlerId, userMessage);

    const session = store.getState().sessions[handlerId];
    expect(session.messages).toHaveLength(2); // user + assistant placeholder (via _appendMessage)
    expect(session.messages[0]).toEqual(userMessage);
    expect(session.messages[1].role).toBe("assistant");
    expect(session.messages[1].parts).toEqual([]);
    expect(session.streamingMessage).toBeDefined();
    expect(session.streamingMessage?.messageId).toBe(session.messages[1].id);
    expect(sendEventToHandler).toHaveBeenCalled();
  });

  // CS-013: sendMessage updates status
  it("should update status when sending message", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    const userMessage: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    // Before sending
    expect(store.getState().sessions[handlerId].status).toBe("ready");

    const sendPromise = store.getState().sendMessage(handlerId, userMessage);

    // Should transition to streaming
    await sendPromise;
    expect(store.getState().sessions[handlerId].status).toBe("streaming");
  });
});

describe("Chat Store - Status Management", () => {
  let client: Client;
  let store: ReturnType<typeof createChatStore>;

  beforeEach(() => {
    client = createMockClient();
    store = createChatStore(client);
    vi.clearAllMocks();
  });

  // CS-014: setStatus
  it("should set session status", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    store.getState().setStatus(handlerId, "streaming");
    expect(store.getState().sessions[handlerId].status).toBe("streaming");

    store.getState().setStatus(handlerId, "error");
    expect(store.getState().sessions[handlerId].status).toBe("error");
  });

  // CS-015: setError
  it("should set session error", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    const error = new Error("Test error");
    store.getState().setError(handlerId, error);

    expect(store.getState().sessions[handlerId].error).toBe(error);
  });

  // CS-016: setError null clears error
  it("should clear error when set to null", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    store.getState().setError(handlerId, new Error("Test"));
    expect(store.getState().sessions[handlerId].error).not.toBeNull();

    store.getState().setError(handlerId, null);
    expect(store.getState().sessions[handlerId].error).toBeNull();
  });
});

describe("Chat Store - Streaming Control", () => {
  let client: Client;
  let store: ReturnType<typeof createChatStore>;

  beforeEach(() => {
    client = createMockClient();
    store = createChatStore(client);
    vi.clearAllMocks();
  });

  // CS-017: stop
  it("should stop streaming and update status", async () => {
    const { unsubscribeFromHandler } = await import(
      "../../src/chat/store/helper"
    );
    const { StreamingMessage } = await import(
      "../../src/chat/store/streaming-message"
    );

    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
    });

    // Simulate streaming state
    store.getState().setStatus(handlerId, "streaming");
    const streamingMsg = new StreamingMessage("msg-1");
    store.getState()._setStreamingMessage(handlerId, streamingMsg);

    await store.getState().stop(handlerId);

    const session = store.getState().sessions[handlerId];
    expect(session.status).toBe("ready");
    expect(session.streamingMessage).toBeNull();
    expect(unsubscribeFromHandler).toHaveBeenCalledWith(handlerId);
  });

  // CS-018: regenerate last user message
  it("should regenerate from last user message", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
      initialMessages: [
        { id: "msg-1", role: "user", parts: [{ type: "text", text: "Hello" }] },
        {
          id: "msg-2",
          role: "assistant",
          parts: [{ type: "text", text: "Hi" }],
        },
      ],
    });

    await store.getState().regenerate(handlerId);

    const session = store.getState().sessions[handlerId];
    // Should keep user message, remove old assistant response, add new placeholder
    expect(session.messages).toHaveLength(2);
    expect(session.messages[0].id).toBe("msg-1");
    expect(session.messages[1].role).toBe("assistant");
    expect(session.messages[1].id).not.toBe("msg-2"); // New message
  });

  // CS-019: regenerate specific message
  it("should regenerate from specific message", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
      initialMessages: [
        { id: "msg-1", role: "user", parts: [{ type: "text", text: "Hello" }] },
        {
          id: "msg-2",
          role: "assistant",
          parts: [{ type: "text", text: "Hi" }],
        },
        {
          id: "msg-3",
          role: "user",
          parts: [{ type: "text", text: "How are you?" }],
        },
        {
          id: "msg-4",
          role: "assistant",
          parts: [{ type: "text", text: "Good!" }],
        },
      ],
    });

    await store.getState().regenerate(handlerId, "msg-1");

    const session = store.getState().sessions[handlerId];
    // Should keep msg-1, remove everything after
    expect(session.messages).toHaveLength(2);
    expect(session.messages[0].id).toBe("msg-1");
    expect(session.messages[1].role).toBe("assistant");
  });

  // CS-020: regenerate throws on no user message
  it("should throw error when no user message to regenerate", async () => {
    const handlerId = await store.getState().createSession({
      workflowName: "chat_agent",
      initialMessages: [
        {
          id: "msg-1",
          role: "assistant",
          parts: [{ type: "text", text: "Hi" }],
        },
      ],
    });

    await expect(store.getState().regenerate(handlerId)).rejects.toThrow(
      "No message found to regenerate"
    );
  });
});

describe("Chat Store - Error Handling", () => {
  let client: Client;
  let store: ReturnType<typeof createChatStore>;

  beforeEach(() => {
    client = createMockClient();
    store = createChatStore(client);
    vi.clearAllMocks();
  });

  // CS-021: sendMessage with non-existent session
  it("should throw error for non-existent session", async () => {
    const message: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    await expect(
      store.getState().sendMessage("non-existent", message)
    ).rejects.toThrow("Session non-existent not found");
  });

  // CS-022: stop with non-existent session
  it("should throw error when stopping non-existent session", async () => {
    await expect(store.getState().stop("non-existent")).rejects.toThrow(
      "Session non-existent not found"
    );
  });
});
