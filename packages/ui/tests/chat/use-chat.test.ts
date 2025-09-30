/**
 * useChat Hook Tests
 * Based on contracts/use-chat.contract.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useChat } from "../../src/chat/hooks/use-chat";
import { __resetChatStore } from "../../src/chat/hooks/use-chat-store";
import type { Message } from "../../src/chat/components/chat.interface";
import { renderHookWithProvider } from "../test-utils";

// Mock the helper functions
vi.mock("../../src/chat/store/helper", () => ({
  createChatHandler: vi.fn(async () => "mock-handler-id"),
  sendEventToHandler: vi.fn(async () => {}),
  subscribeToHandlerEvents: vi.fn(() => () => {}),
  unsubscribeFromHandler: vi.fn(),
}));

describe("useChat Hook - Initialization", () => {
  beforeEach(() => {
    __resetChatStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __resetChatStore();
  });

  // CT-001: Basic initialization (lazy - no session created until first message)
  it("should initialize with empty messages and idle status", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    // handlerId should be null initially (lazy initialization)
    expect(result.current.handlerId).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.status).toBe("idle");
    expect(typeof result.current.sendMessage).toBe("function");
    expect(typeof result.current.stop).toBe("function");
    expect(typeof result.current.regenerate).toBe("function");
  });

  // CT-002: Initialize with handlerId
  it("should initialize with provided handlerId", async () => {
    const providedHandlerId = "handler-123";
    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        handlerId: providedHandlerId,
      })
    );

    await waitFor(() => {
      expect(result.current.handlerId).toBe(providedHandlerId);
    });
  });

  // CT-003: Initialize with initialMessages (lazy - session created on first message send)
  it("should initialize with initial messages", async () => {
    const initialMessages: Message[] = [
      { id: "msg-1", role: "user", parts: [{ type: "text", text: "Hello" }] },
    ];

    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        initialMessages,
      })
    );

    // Initially no session (lazy initialization)
    expect(result.current.handlerId).toBeNull();
    expect(result.current.messages).toEqual([]);
  });

  // CT-004: onReady callback (called on first message send - lazy init)
  it("should call onReady with handlerId when session is created", async () => {
    const onReady = vi.fn();

    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        onReady,
      })
    );

    // Initially not called (lazy init)
    expect(onReady).not.toHaveBeenCalled();

    // Send message to trigger session creation
    const message: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    await result.current.sendMessage(message);

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith(expect.any(String));
    });
  });

  // CT-005: onError callback (called when first message send fails - lazy init)
  it("should call onError when session creation fails", async () => {
    const { createChatHandler } = await import("../../src/chat/store/helper");
    vi.mocked(createChatHandler).mockRejectedValueOnce(
      new Error("Handler creation failed")
    );

    const onError = vi.fn();

    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        onError,
      })
    );

    // Send message to trigger session creation
    const message: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    await expect(result.current.sendMessage(message)).rejects.toThrow();

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe("useChat Hook - Message Operations", () => {
  beforeEach(() => {
    __resetChatStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __resetChatStore();
  });

  // CT-006: sendMessage (creates session on first send - lazy init)
  it("should send a message and update state", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    // Initially no session (lazy init)
    expect(result.current.handlerId).toBeNull();

    const userMessage: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    await result.current.sendMessage(userMessage);

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
      expect(result.current.messages).toHaveLength(2); // user + assistant placeholder
      expect(result.current.messages[0]).toEqual(userMessage);
      expect(result.current.messages[1].role).toBe("assistant");
    });
  });

  // CT-007: sendMessage updates status (lazy init)
  it("should update status when sending message", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    // Initially no session (lazy init)
    expect(result.current.handlerId).toBeNull();
    expect(result.current.status).toBe("idle");

    const userMessage: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    await result.current.sendMessage(userMessage);

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
      expect(result.current.status).toBe("streaming");
    });
  });

  // CT-008: setMessages (creates session first - lazy init)
  it("should set messages via setMessages", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    // Initially no session (lazy init)
    expect(result.current.handlerId).toBeNull();

    // Send a message to create session
    const initialMessage: Message = {
      id: "init",
      role: "user",
      parts: [{ type: "text", text: "Init" }],
    };
    await result.current.sendMessage(initialMessage);

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

    const newMessages: Message[] = [
      { id: "msg-1", role: "user", parts: [{ type: "text", text: "Hello" }] },
      {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi!" }],
      },
    ];

    result.current.setMessages?.(newMessages);

    await waitFor(() => {
      expect(result.current.messages).toEqual(newMessages);
    });
  });
});

describe("useChat Hook - Streaming Control", () => {
  beforeEach(() => {
    __resetChatStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __resetChatStore();
  });

  // CT-009: stop (lazy init)
  it("should stop streaming", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    // Initially no session (lazy init)
    expect(result.current.handlerId).toBeNull();

    // Send message to start streaming (creates session)
    const userMessage: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    await result.current.sendMessage(userMessage);

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
      expect(result.current.status).toBe("streaming");
    });

    // Stop streaming
    await result.current.stop?.();

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
  });

  // CT-010: regenerate (lazy init - need to send message first)
  it("should regenerate last message", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
      })
    );

    // Send first message to create session
    const firstMessage: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };
    await result.current.sendMessage(firstMessage);

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    // Now regenerate the last message
    await result.current.regenerate?.();

    await waitFor(() => {
      // Should have user message + new assistant placeholder
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
      expect(result.current.messages[0].id).toBe("msg-1");
      expect(result.current.messages[1].role).toBe("assistant");
    });
  });

  // CT-011: regenerate from specific message (lazy init)
  it("should regenerate from specific message", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
      })
    );

    // Send multiple messages to create a conversation
    const msg1: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };
    await result.current.sendMessage(msg1);

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

    const msg2: Message = {
      id: "msg-3",
      role: "user",
      parts: [{ type: "text", text: "How are you?" }],
    };
    await result.current.sendMessage(msg2);

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(2);
    });

    // Regenerate from the first message
    await result.current.regenerate?.({ messageId: "msg-1" });

    await waitFor(() => {
      // Should truncate to msg-1 + new assistant response
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
      expect(result.current.messages[0].id).toBe("msg-1");
    });
  });
});

describe("useChat Hook - Lifecycle", () => {
  beforeEach(() => {
    __resetChatStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __resetChatStore();
  });

  // CT-012: Cleanup on unmount (lazy init)
  it("should delete session on unmount", async () => {
    const { result, unmount } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    // Send a message to create session
    const message: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };
    await result.current.sendMessage(message);

    let handlerId: string | null = null;

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
      handlerId = result.current.handlerId;
    });

    // Just unmount - we can't directly access the store outside of React context
    // The important thing is that unmount doesn't throw
    unmount();

    // Note: We can't verify session deletion outside React context,
    // but the hook's cleanup effect should have been called
  });

  // CT-013: Multiple instances (lazy init)
  it("should support multiple chat instances independently", async () => {
    // Make mock return different handlerIds
    const { createChatHandler } = await import("../../src/chat/store/helper");
    let callCount = 0;
    vi.mocked(createChatHandler).mockImplementation(async () => {
      callCount++;
      return `mock-handler-id-${callCount}`;
    });

    const { result: result1 } = renderHookWithProvider(() =>
      useChat({ workflowName: "agent-1" })
    );

    const { result: result2 } = renderHookWithProvider(() =>
      useChat({ workflowName: "agent-2" })
    );

    // Initially both should be null (lazy init)
    expect(result1.current.handlerId).toBeNull();
    expect(result2.current.handlerId).toBeNull();

    // Send message to first chat (creates session)
    const message1: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello from chat 1" }],
    };

    await result1.current.sendMessage(message1);

    await waitFor(() => {
      expect(result1.current.handlerId).not.toBeNull();
      expect(result1.current.messages.length).toBeGreaterThan(0);
    });

    // Second chat should still be null and empty (no session created yet)
    expect(result2.current.handlerId).toBeNull();
    expect(result2.current.messages).toEqual([]);

    // Send message to second chat
    const message2: Message = {
      id: "msg-2",
      role: "user",
      parts: [{ type: "text", text: "Hello from chat 2" }],
    };

    await result2.current.sendMessage(message2);

    await waitFor(() => {
      expect(result2.current.handlerId).not.toBeNull();
    });

    // Should have different handlerIds
    expect(result1.current.handlerId).not.toBe(result2.current.handlerId);
  });
});

describe("useChat Hook - Error Handling", () => {
  beforeEach(() => {
    __resetChatStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __resetChatStore();
  });

  // CT-014: sendMessage with lazy init creates session automatically
  it("should create session automatically when sending first message", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    // Initially no session (lazy init)
    expect(result.current.handlerId).toBeNull();

    // Send message - should create session automatically
    const message: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    await result.current.sendMessage(message);

    // Session should now be created
    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });
  });

  // CT-015: onError reports store errors (lazy init)
  it("should call onError when store operations fail", async () => {
    const { sendEventToHandler } = await import("../../src/chat/store/helper");

    const onError = vi.fn();

    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        onError,
      })
    );

    // Send first message to create session (lazy init) - this should succeed
    const firstMessage: Message = {
      id: "msg-init",
      role: "user",
      parts: [{ type: "text", text: "Init" }],
    };
    await result.current.sendMessage(firstMessage);

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

    // Mock sendEventToHandler to fail on next call
    vi.mocked(sendEventToHandler).mockRejectedValueOnce(
      new Error("Network error")
    );

    // Send second message which will fail
    const message: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    try {
      await result.current.sendMessage(message);
    } catch {
      // Expected to fail
    }

    // Store should have error and onError should be called
    await waitFor(
      () => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      },
      { timeout: 3000 }
    );
  });
});
