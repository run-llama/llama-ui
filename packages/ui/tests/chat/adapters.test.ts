/**
 * Adapter Tests: Message ↔ Event Conversion
 * Based on contracts/adapters.contract.ts
 * 
 * These tests MUST FAIL initially (TDD) - adapters not yet implemented
 */

import { describe, it, expect } from "vitest";
import type { Message } from "@/src/chat/components/chat.interface";
import type { MessagePart, TextPart } from "@/src/chat/components/message-parts/types";
import type { WorkflowEvent } from "@/src/workflows/types";
import {
  messageToEvent,
  extractTextFromParts,
  isDeltaEvent,
  isStopEvent,
  isInputRequiredEvent,
  isMessageTerminator,
} from "@/src/chat/store/adapters";

describe("messageToEvent", () => {
  // AC-001: basic text message
  it("should convert message with single TextPart to HumanResponseEvent", () => {
    const message: Message = {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    };

    const event = messageToEvent(message);

    expect(event.type).toBe("workflow.events.HumanResponseEvent");
    expect(event.data).toEqual({
      response: "Hello",
    });
  });

  // AC-002: multi-part text message
  it("should concatenate multiple TextParts with spaces", () => {
    const message: Message = {
      id: "msg-2",
      role: "user",
      parts: [
        { type: "text", text: "Hello" },
        { type: "text", text: "World" },
      ],
    };

    const event = messageToEvent(message);

    expect(event.data).toMatchObject({
      response: "Hello World",
    });
  });

  // AC-003: empty message
  it("should throw error for empty message", () => {
    const message: Message = {
      id: "msg-3",
      role: "user",
      parts: [{ type: "text", text: "" }],
    };

    expect(() => messageToEvent(message)).toThrow("Cannot send empty message");
  });

  it("should throw error for message with no TextParts", () => {
    const message: Message = {
      id: "msg-4",
      role: "user",
      parts: [],
    };

    expect(() => messageToEvent(message)).toThrow("Cannot send empty message");
  });

  // AC-004: non-text parts ignored
  it("should ignore non-text parts", () => {
    const message: Message = {
      id: "msg-5",
      role: "user",
      parts: [
        { type: "text", text: "Hello" },
        { type: "data-file", data: { name: "file.pdf" } } as any,
      ],
    };

    const event = messageToEvent(message);

    expect(event.data).toMatchObject({
      response: "Hello",
    });
  });

  // AC-005: extracts only text content
  it("should extract only text content to response field", () => {
    const message: Message = {
      id: "msg-123",
      role: "user",
      parts: [{ type: "text", text: "Test" }],
    };

    const event = messageToEvent(message);

    expect(event.data).toEqual({
      response: "Test",
    });
  });
});

// Note: eventToMessageParts is deprecated - StreamingMessage now handles event-to-parts conversion

describe("extractTextFromParts", () => {
  // AC-013: multiple TextParts
  it("should concatenate multiple TextParts with spaces", () => {
    const parts: MessagePart[] = [
      { type: "text", text: "Hello" },
      { type: "text", text: "World" },
    ];

    const text = extractTextFromParts(parts);

    expect(text).toBe("Hello World");
  });

  // AC-014: mixed parts
  it("should extract only text from mixed parts", () => {
    const parts: MessagePart[] = [
      { type: "text", text: "Hello" },
      { type: "data-file", data: {} } as any,
      { type: "text", text: "World" },
    ];

    const text = extractTextFromParts(parts);

    expect(text).toBe("Hello World");
  });

  // AC-015: no text parts
  it("should return empty string when no TextParts", () => {
    const parts: MessagePart[] = [
      { type: "data-file", data: {} } as any,
    ];

    const text = extractTextFromParts(parts);

    expect(text).toBe("");
  });

  it("should return empty string for empty array", () => {
    const text = extractTextFromParts([]);
    expect(text).toBe("");
  });
});

describe("isDeltaEvent", () => {
  // AC-016: true case
  it("should return true for ChatDeltaEvent", () => {
    expect(isDeltaEvent({ type: "workflow.events.ChatDeltaEvent", data: { delta: "test" } })).toBe(true);
  });

  it("should match ChatDeltaEvent by exact string", () => {
    expect(isDeltaEvent({ type: "workflow.events.ChatDeltaEvent", data: { delta: "test" } })).toBe(true);
    expect(isDeltaEvent({ type: "ChatDeltaEvent", data: { delta: "test" } })).toBe(true);
  });

  // AC-017: false cases
  it("should return false for non-delta types", () => {
    expect(isDeltaEvent({ type: "workflow.events.StopEvent", data: {} })).toBe(false);
    expect(isDeltaEvent({ type: "workflow.events.InputRequiredEvent", data: {} })).toBe(false);
    expect(isDeltaEvent({ type: "workflow.status", data: {} })).toBe(false);
  });
});

describe("isStopEvent", () => {
  // AC-018: true case
  it("should return true for StopEvent", () => {
    const event: WorkflowEvent = {
      type: "workflow.events.StopEvent",
      data: {},
    };

    expect(isStopEvent(event)).toBe(true);
  });

  // AC-019: false cases
  it("should return false for non-StopEvent types", () => {
    expect(isStopEvent({ type: "workflow.events.StartEvent", data: {} })).toBe(false);
    expect(isStopEvent({ type: "workflow.events.InputRequiredEvent", data: {} })).toBe(false);
    expect(isStopEvent({ type: "workflow.events.ChatDeltaEvent", data: {} })).toBe(false);
  });
});

describe("isInputRequiredEvent", () => {
  it("should return true for InputRequiredEvent", () => {
    const event: WorkflowEvent = {
      type: "workflow.events.InputRequiredEvent",
      data: { prefix: "waiting" },
    };

    expect(isInputRequiredEvent(event)).toBe(true);
  });

  it("should return false for non-InputRequiredEvent types", () => {
    expect(isInputRequiredEvent({ type: "workflow.events.StopEvent", data: {} })).toBe(false);
    expect(isInputRequiredEvent({ type: "workflow.events.ChatDeltaEvent", data: {} })).toBe(false);
  });
});

describe("isMessageTerminator", () => {
  it("should return true for StopEvent", () => {
    const event: WorkflowEvent = {
      type: "workflow.events.StopEvent",
      data: {},
    };

    expect(isMessageTerminator(event)).toBe(true);
  });

  it("should return true for InputRequiredEvent", () => {
    const event: WorkflowEvent = {
      type: "workflow.events.InputRequiredEvent",
      data: { prefix: "waiting" },
    };

    expect(isMessageTerminator(event)).toBe(true);
  });

  it("should return false for non-terminator events", () => {
    expect(isMessageTerminator({ type: "workflow.events.ChatDeltaEvent", data: {} })).toBe(false);
    expect(isMessageTerminator({ type: "workflow.events.StartEvent", data: {} })).toBe(false);
  });
});
