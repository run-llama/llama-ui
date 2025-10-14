/**
 * Adapter Tests: Message ↔ Event Conversion
 * Based on contracts/adapters.contract.ts
 *
 * These tests MUST FAIL initially (TDD) - adapters not yet implemented
 */

import { describe, it, expect } from "vitest";
import type { Message } from "@/src/chat/components/chat.interface";
import { MessageRole } from "@/src/chat/components/chat.interface";
import type {
  MessagePart,
  SourcesPart,
  SuggestionPart,
  TextPart,
} from "@/src/chat/components/message-parts/types";
import {
  TextPartType,
  SourcesPartType,
  SuggestionPartType,
} from "@/src/chat/components/message-parts/types";
import {
  ChatDeltaEvent,
  InputRequiredEvent,
  StartEvent,
  StopEvent,
  WorkflowEvent,
  WorkflowEventType,
} from "@/src/workflows/store/workflow-event";
import {
  messageToEvent,
  extractTextFromParts,
  isMessageTerminator,
} from "@/src/chat/store/adapters";
import { StreamingMessage } from "@/src/chat/store/streaming-message";

describe("messageToEvent", () => {
  // AC-001: basic text message
  it("should convert message with single TextPart to HumanResponseEvent", () => {
    const message: Message = {
      id: "msg-1",
      role: MessageRole.User,
      parts: [{ type: TextPartType, text: "Hello" }],
    };

    const event = messageToEvent(message);

    expect(event.type).toBe(WorkflowEventType.HumanResponseEvent);
    expect(event.data).toEqual({
      response: "Hello",
    });
  });

  // AC-002: multi-part text message
  it("should concatenate multiple TextParts with spaces", () => {
    const message: Message = {
      id: "msg-2",
      role: MessageRole.User,
      parts: [
        { type: TextPartType, text: "Hello" },
        { type: TextPartType, text: "World" },
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
      role: MessageRole.User,
      parts: [{ type: TextPartType, text: "" }],
    };

    expect(() => messageToEvent(message)).toThrow("Cannot send empty message");
  });

  it("should throw error for message with no TextParts", () => {
    const message: Message = {
      id: "msg-4",
      role: MessageRole.User,
      parts: [],
    };

    expect(() => messageToEvent(message)).toThrow("Cannot send empty message");
  });

  // AC-004: non-text parts ignored
  it("should ignore non-text parts", () => {
    const message: Message = {
      id: "msg-5",
      role: MessageRole.User,
      parts: [
        { type: TextPartType, text: "Hello" },
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
      role: MessageRole.User,
      parts: [{ type: TextPartType, text: "Test" }],
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
      { type: TextPartType, text: "Hello" },
      { type: TextPartType, text: "World" },
    ];

    const text = extractTextFromParts(parts);

    expect(text).toBe("Hello World");
  });

  // AC-014: mixed parts
  it("should extract only text from mixed parts", () => {
    const parts: MessagePart[] = [
      { type: TextPartType, text: "Hello" },
      { type: "data-file", data: {} } as any,
      { type: TextPartType, text: "World" },
    ];

    const text = extractTextFromParts(parts);

    expect(text).toBe("Hello World");
  });

  // AC-015: no text parts
  it("should return empty string when no TextParts", () => {
    const parts: MessagePart[] = [{ type: "data-file", data: {} } as any];

    const text = extractTextFromParts(parts);

    expect(text).toBe("");
  });

  it("should return empty string for empty array", () => {
    const text = extractTextFromParts([]);
    expect(text).toBe("");
  });
});

describe("isMessageTerminator", () => {
  it("should return true for InputRequiredEvent", () => {
    const event = new InputRequiredEvent(WorkflowEventType.InputRequiredEvent, {
      prefix: "waiting",
    });

    expect(isMessageTerminator(event)).toBe(true);
  });

  it("should return false for non-terminator events", () => {
    expect(
      isMessageTerminator(
        new StopEvent(WorkflowEventType.StopEvent, { result: {} })
      )
    ).toBe(false);
    expect(
      isMessageTerminator(
        new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, { delta: "" })
      )
    ).toBe(false);
    expect(
      isMessageTerminator(
        new StartEvent(WorkflowEventType.StartEvent, { input: {} })
      )
    ).toBe(false);
  });
});

describe("StreamingMessage (XML markers parsing)", () => {
  it("should parse streaming ChatDeltaEvents with XML markers (sources)", () => {
    const streaming = new StreamingMessage("msg-1");

    // Simulate streaming events with sources XML marker
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Here are the results:\n\n",
      })
    );
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "<sources>\n",
      })
    );
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta:
          '{"nodes": [{"id": "1", "text": "Result 1", "metadata": {"title": "Doc 1"}}]}\n',
      })
    );
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "</sources>\n\n",
      })
    );
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, { delta: "Done!" })
    );

    const parts = streaming.getParts();

    // Should have 3 parts: text before, sources, text after
    expect(parts.length).toBeGreaterThanOrEqual(2);

    // Find sources part
    const sourcesPart: SourcesPart = parts.find(
      (p) => p.type === SourcesPartType
    ) as SourcesPart;
    expect(sourcesPart).toBeDefined();
    expect(sourcesPart.data).toEqual({
      nodes: [{ id: "1", text: "Result 1", metadata: { title: "Doc 1" } }],
    });

    // Find text parts
    const textParts = parts.filter(
      (p) => p.type === TextPartType
    ) as TextPart[];
    expect(textParts.length).toBeGreaterThanOrEqual(1);
  });

  it("should parse streaming ChatDeltaEvents with XML markers (suggested_questions)", () => {
    const streaming = new StreamingMessage("msg-2");

    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Here you go!\n\n",
      })
    );
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "<suggested_questions>\n",
      })
    );
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: '["Question 1", "Question 2"]\n',
      })
    );
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "</suggested_questions>",
      })
    );
    const parts = streaming.getParts();

    // Find suggested_questions part
    const suggestionsPart = parts.find(
      (p) => p.type === SuggestionPartType
    ) as SuggestionPart;
    expect(suggestionsPart).toBeDefined();
    expect(suggestionsPart.data).toEqual(["Question 1", "Question 2"]);
  });

  it("should handle streaming ChatDeltaEvents with plain text (no XML)", () => {
    const streaming = new StreamingMessage("msg-3");

    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Plain text message",
      })
    );

    const parts = streaming.getParts();

    expect(parts.length).toBe(1);
    expect(parts[0]).toEqual({
      type: TextPartType,
      text: "Plain text message",
    });
  });

  it("should merge consecutive text deltas", () => {
    const streaming = new StreamingMessage("msg-4");

    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, { delta: "Hello " })
    );
    streaming.addEvent(
      new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, { delta: "World" })
    );

    const parts = streaming.getParts();

    expect(parts.length).toBe(1);
    expect((parts[0] as TextPart).text).toBe("Hello World");
  });
});
