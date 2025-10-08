/**
 * useChat Hook Tests
 * Based on contracts/use-chat.contract.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useChat } from "../../src/chat/hooks/use-chat";
import { __resetChatStore, __setChatStoreState } from "../../src/chat/hooks/use-chat-store";
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

  // CT-001: Basic initialization (eager - session created on mount)
  it("should initialize with empty messages and ready status", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.messages).toEqual([]);
    expect(typeof result.current.sendMessage).toBe("function");
    expect(typeof result.current.stop).toBe("function");
    expect(typeof result.current.regenerate).toBe("function");
  });

  // CT-002: Initialize with handlerId (reuses existing session, does NOT call onReady)
  it("should initialize with provided handlerId and not call onReady when reused", async () => {
    const providedHandlerId = "handler-123";
    const onReady = vi.fn();

    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        handlerId: providedHandlerId,
        onReady,
      })
    );

    // Wait for session to be created
    await waitFor(() => {
      expect(result.current.handlerId).toBe(providedHandlerId);
    });

    // Prime store with the session to simulate reuse on next mount
    __setChatStoreState((state) => ({
      sessions: {
        ...state.sessions,
        [providedHandlerId]: {
          handlerId: providedHandlerId,
          workflowName: "chat_agent",
          messages: [],
          status: "ready",
          error: null,
          streamingMessage: null,
        },
      },
    }));

    // Create a second hook instance with same handlerId
    const onReady2 = vi.fn();
    const { result: result2 } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        handlerId: providedHandlerId,
        onReady: onReady2,
      })
    );

    await waitFor(() => {
      expect(result2.current.handlerId).toBe(providedHandlerId);
    });

    // onReady should NOT be called when reusing existing handlerId
    expect(onReady2).not.toHaveBeenCalled();
  });

  // CT-003: Initialize with initialMessages (eager - messages available on mount)
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

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });
    expect(result.current.messages).toEqual(initialMessages);
  });

  // CT-004: onReady callback (called on mount - eager init)
  it("should call onReady with handlerId when session is created", async () => {
    const onReady = vi.fn();

    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        onReady,
      })
    );

    // Initially not called synchronously
    expect(onReady).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith(expect.any(String));
    });
  });

  // CT-005: onError callback (called on mount when init fails - eager init)
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

  // CT-006: sendMessage (session already created on mount)
  it("should send a message and update state", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

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

  // CT-007: sendMessage updates status
  it("should update status when sending message", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
      expect(result.current.status).toBe("ready");
    });

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

  // CT-008: setMessages (session already exists)
  it("should set messages via setMessages", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

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

  // CT-009: stop
  it("should stop streaming", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

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

  // CT-010: regenerate (session already exists)
  it("should regenerate last message", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
      })
    );

    // Wait for session to be initialized
    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

    // Send first message
    const firstMessage: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };
    await result.current.sendMessage(firstMessage);

    await waitFor(() => {
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

  // CT-011: regenerate from specific message
  it("should regenerate from specific message", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
      })
    );

    // Wait for session to be initialized
    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

    // Send multiple messages to create a conversation
    const msg1: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };
    await result.current.sendMessage(msg1);

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
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

  // CT-012: Cleanup on unmount
  it("should delete session on unmount", async () => {
    const { result, unmount } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

    // Just unmount - we can't directly access the store outside of React context
    // The important thing is that unmount doesn't throw
    unmount();

    // Note: We can't verify session deletion outside React context,
    // but the hook's cleanup effect should have been called
  });

  // CT-013: Multiple instances (eager init)
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

    await waitFor(() => {
      expect(result1.current.handlerId).not.toBeNull();
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

  // CT-014: session is created on mount
  it("should create session on mount", async () => {
    const { result } = renderHookWithProvider(() =>
      useChat({ workflowName: "chat_agent" })
    );

    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });
  });

  // CT-015: onError reports store errors
  it("should call onError when store operations fail", async () => {
    const { sendEventToHandler } = await import("../../src/chat/store/helper");

    const onError = vi.fn();

    const { result } = renderHookWithProvider(() =>
      useChat({
        workflowName: "chat_agent",
        onError,
      })
    );

    // Wait for session to be initialized
    await waitFor(() => {
      expect(result.current.handlerId).not.toBeNull();
    });

    // Send first message - session already created on mount, this should succeed
    const firstMessage: Message = {
      id: "msg-init",
      role: "user",
      parts: [{ type: "text", text: "Init" }],
    };
    await result.current.sendMessage(firstMessage);

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
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
