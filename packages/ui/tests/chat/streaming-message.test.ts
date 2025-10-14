/**
 * StreamingMessage Tests
 * Tests for event accumulation and incremental parsing
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StreamingMessage } from "@/src/chat/store/streaming-message";
import {
  ChatDeltaEvent,
  StopEvent,
  WorkflowEvent,
  WorkflowEventType,
} from "@/src/workflows/store/workflow-event";

describe("StreamingMessage", () => {
  let streamingMsg: StreamingMessage;
  const messageId = "msg-123";

  beforeEach(() => {
    streamingMsg = new StreamingMessage(messageId);
  });

  describe("constructor", () => {
    it("should initialize with messageId", () => {
      expect(streamingMsg.messageId).toBe(messageId);
    });

    it("should initialize with streaming status", () => {
      expect(streamingMsg.status).toBe("streaming");
    });

    it("should initialize with empty parts", () => {
      expect(streamingMsg.getParts()).toEqual([]);
    });
  });

  describe("addEvent - delta events", () => {
    it("should accumulate adjacent delta events", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Hello",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: " World",
      });

      streamingMsg.addEvent(delta1);
      streamingMsg.addEvent(delta2);

      // Delta events are accumulated in buffer and parsed to text parts
      const parts = streamingMsg.getParts();
      expect(parts).toHaveLength(1);
      expect(parts[0]).toMatchObject({
        type: "text",
        text: "Hello World",
      });
    });

    it("should update parts incrementally", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "```py",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "thon\n",
      });
      const delta3 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "print('hi')\n```",
      });

      streamingMsg.addEvent(delta1);
      // First delta might have incomplete markdown
      const parts1 = streamingMsg.getParts();
      expect(parts1.length).toBeGreaterThan(0);

      streamingMsg.addEvent(delta2);
      streamingMsg.addEvent(delta3);

      // Final parts should have complete code block
      const parts = streamingMsg.getParts();
      expect(parts.length).toBeGreaterThan(0);
      const fullText = parts
        .filter((p) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
      expect(fullText).toContain("```python");
      expect(fullText).toContain("print('hi')");
    });

    it("should handle empty delta", () => {
      const delta = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "",
      });

      streamingMsg.addEvent(delta);

      // Empty delta doesn't create any parts
      expect(streamingMsg.getParts()).toEqual([]);
      // But the event is still stored
      expect(streamingMsg.getEvents()).toHaveLength(1);
    });
  });

  describe("addEvent - non-delta events", () => {
    it("should flush text buffer when non-delta event arrives", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Hello",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: " World",
      });
      const toolCall = new WorkflowEvent(WorkflowEventType.ToolCallEvent, {
        tool: "search",
        args: {},
      });

      streamingMsg.addEvent(delta1);
      streamingMsg.addEvent(delta2);
      streamingMsg.addEvent(toolCall);

      const parts = streamingMsg.getParts();
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatchObject({
        type: "text",
        text: "Hello World",
      });
      expect(parts[1]).toMatchObject({
        type: "ToolCallEvent",
        data: { tool: "search", args: {} },
      });
    });

    it("should keep adjacent deltas separate after flush", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "First",
      });
      const toolCall = new WorkflowEvent(WorkflowEventType.ToolCallEvent, {
        tool: "test",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Second",
      });

      streamingMsg.addEvent(delta1);
      streamingMsg.addEvent(toolCall);
      streamingMsg.addEvent(delta2);

      const parts = streamingMsg.getParts();
      expect(parts).toHaveLength(3);
      expect(parts[0]).toMatchObject({ type: "text", text: "First" });
      expect(parts[1]).toMatchObject({
        type: "ToolCallEvent",
        data: { tool: "test" },
      });
      expect(parts[2]).toMatchObject({ type: "text", text: "Second" });
    });
  });

  describe("addEvent - special events", () => {
    it("should skip StopEvent (no content)", () => {
      const stopEvent = new StopEvent(WorkflowEventType.StopEvent, {
        result: "done",
      });
      streamingMsg.addEvent(stopEvent);

      expect(streamingMsg.getParts()).toEqual([]);
      expect(streamingMsg.getEvents()).toHaveLength(1);
    });

    it("should ignore malformed events", () => {
      const malformed = { data: "test" } as any;

      streamingMsg.addEvent(malformed);

      expect(streamingMsg.getParts()).toEqual([]);
      expect(streamingMsg.getEvents()).toEqual([]);
    });

    it("should ignore events without type", () => {
      const noType = { type: "", data: "test" } as any;

      streamingMsg.addEvent(noType);

      expect(streamingMsg.getParts()).toEqual([]);
    });
  });

  describe("complete", () => {
    it("should flush remaining text buffer", () => {
      const delta = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Hello",
      });

      streamingMsg.addEvent(delta);
      streamingMsg.complete();

      const parts = streamingMsg.getParts();
      expect(parts).toHaveLength(1);
      expect(parts[0]).toMatchObject({
        type: "text",
        text: "Hello",
      });
    });

    it("should change status to completed", () => {
      streamingMsg.complete();

      expect(streamingMsg.status).toBe("completed");
    });

    it("should handle multiple complete calls", () => {
      const delta = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Test",
      });

      streamingMsg.addEvent(delta);
      streamingMsg.complete();
      streamingMsg.complete();

      expect(streamingMsg.status).toBe("completed");
      const parts = streamingMsg.getParts();
      expect(parts).toHaveLength(1);
    });
  });

  describe("getParts", () => {
    it("should return parts without re-parsing (cached logic)", () => {
      const delta = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Hello",
      });

      streamingMsg.addEvent(delta);
      // Must complete to flush the buffer and finalize parts
      streamingMsg.complete();

      const parts1 = streamingMsg.getParts();
      const parts2 = streamingMsg.getParts();

      // Should have same content (parsing happens once in addEvent)
      expect(parts1).toEqual(parts2);
      expect(parts1).toHaveLength(1);
      expect(parts1[0]).toMatchObject({ type: "text", text: "Hello" });
    });

    it("should return finalized + current parts", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "First",
      });
      const toolCall = new WorkflowEvent(WorkflowEventType.ToolCallEvent, {
        tool: "test",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Second",
      });

      streamingMsg.addEvent(delta1);
      streamingMsg.addEvent(toolCall);
      // At this point, "First" is finalized, toolCall is finalized

      streamingMsg.addEvent(delta2);
      // "Second" is in current buffer

      const parts = streamingMsg.getParts();
      expect(parts).toHaveLength(3);
    });
  });

  describe("getEvents", () => {
    it("should return all accumulated events", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Hello",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: " World",
      });

      streamingMsg.addEvent(delta1);
      streamingMsg.addEvent(delta2);

      const events = streamingMsg.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0]).toEqual(delta1);
      expect(events[1]).toEqual(delta2);
    });

    it("should return copy of events array", () => {
      const delta = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Test",
      });

      streamingMsg.addEvent(delta);

      const events1 = streamingMsg.getEvents();
      const events2 = streamingMsg.getEvents();

      // Should be different references (defensive copy)
      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });
  });

  describe("getTextBuffer", () => {
    it("should return current text buffer", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Hello",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: " World",
      });

      streamingMsg.addEvent(delta1);
      streamingMsg.addEvent(delta2);

      // Text buffer contains accumulated delta text
      expect(streamingMsg.getTextBuffer()).toBe("Hello World");
    });

    it("should return empty string after flush", () => {
      const delta = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Hello",
      });
      const toolCall = new WorkflowEvent(WorkflowEventType.ToolCallEvent, {
        tool: "test",
      });

      streamingMsg.addEvent(delta);
      streamingMsg.addEvent(toolCall); // Triggers flush

      expect(streamingMsg.getTextBuffer()).toBe("");
    });
  });

  describe("clear", () => {
    it("should reset all state", () => {
      const delta = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Hello",
      });

      streamingMsg.addEvent(delta);
      streamingMsg.complete();
      streamingMsg.clear();

      expect(streamingMsg.getParts()).toEqual([]);
      expect(streamingMsg.getEvents()).toEqual([]);
      expect(streamingMsg.getTextBuffer()).toBe("");
      expect(streamingMsg.status).toBe("streaming");
    });
  });

  describe("XML protocol integration", () => {
    it("should parse XML markers in complete text", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Here are sources: <sources>",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: '{"nodes": []}',
      });
      const delta3 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "</sources>",
      });

      streamingMsg.addEvent(delta1);
      streamingMsg.addEvent(delta2);
      streamingMsg.addEvent(delta3);

      const parts = streamingMsg.getParts();
      // Should have text part + sources part
      expect(parts.length).toBeGreaterThan(1);
      expect(parts.some((p) => p.type === "data-sources")).toBe(true);
    });

    it("should handle incomplete XML during streaming", () => {
      const delta1 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: "Text with <sources",
      });
      const delta2 = new ChatDeltaEvent(WorkflowEventType.ChatDeltaEvent, {
        delta: ">data</sources>",
      });

      streamingMsg.addEvent(delta1);

      const parts1 = streamingMsg.getParts();
      // Should show text (incomplete XML not parsed yet)
      expect(parts1.length).toBeGreaterThan(0);

      streamingMsg.addEvent(delta2);

      const parts2 = streamingMsg.getParts();
      // Now should attempt to parse complete XML
      expect(parts2.length).toBeGreaterThan(0);
    });
  });
});
