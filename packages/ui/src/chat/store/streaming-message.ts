/**
 * StreamingMessage Class
 * Manages event accumulation and parsing for streaming messages
 * 
 * Problem:
 * - During streaming, delta events contain partial text (e.g., "```py", "thon\n", "def ")
 * - Parsing each event individually breaks markdown/XML syntax detection
 * - Different event types (delta, tool call, etc.) should not be merged together
 * 
 * Solution:
 * - Only merge **adjacent** delta events
 * - When a non-delta event arrives, flush the current text buffer
 * - Maintain two lists: finalized parts + current text parts
 * - Incrementally update for O(1) getParts()
 * 
 * Example flow:
 * 1. delta1 + delta2 + delta3 → merged in buffer, parsed as TextPart(s)
 * 2. tool_call_event → flush buffer to finalized, append ToolCallPart to finalized
 * 3. delta4 + delta5 → merged in new buffer, parsed as TextPart(s)
 * 4. InputRequiredEvent → flush buffer to finalized, append InputRequiredPart to finalized
 * 
 * Usage in chat-store:
 * - Create instance when streaming starts (with messageId)
 * - Call addEvent() for each incoming event (triggers incremental parse)
 * - Call getParts() to get current MessagePart[] (returns finalized + current)
 * - Call complete() when streaming ends (flushes remaining buffer)
 */

import type { WorkflowEvent } from "../../workflows/types";
import type { MessagePart } from "../components/message-parts/types";
import { parseTextWithXMLMarkers } from "./adapters";
import { isDeltaEvent, isStopEvent } from "./adapters";

export class StreamingMessage {
  private events: WorkflowEvent[] = [];
  private currentTextBuffer: string = ""; // Buffer for adjacent delta events
  private currentTextParts: MessagePart[] = []; // Parsed parts from current buffer
  private finalizedParts: MessagePart[] = []; // Finalized parts (flushed)
  private _status: "streaming" | "completed" = "streaming";
  public readonly messageId: string;

  constructor(messageId: string) {
    this.messageId = messageId;
  }

  /**
   * Get current status
   */
  get status(): "streaming" | "completed" {
    return this._status;
  }

  /**
   * Add a new event and incrementally update the parsed result
   * Only adjacent delta events are merged together
   */
  addEvent(event: WorkflowEvent): void {
    // Skip malformed events
    if (!event || !event.type) {
      return;
    }

    this.events.push(event);

    // Skip StopEvent (doesn't contribute to message content)
    if (isStopEvent(event)) {
      return;
    }

    // Handle delta events: accumulate in buffer
    if (isDeltaEvent(event)) {
      const delta = event.data.delta;
      if (delta) {
        this.currentTextBuffer += delta;
        // Re-parse the current buffer to update preview
        this.currentTextParts = this.currentTextBuffer
          ? parseTextWithXMLMarkers(this.currentTextBuffer)
          : [];
      }
      return;
    }

    // Non-delta event: flush current text buffer first
    this.flushTextBuffer();

    // Then append the non-delta event to finalized parts
    this.finalizedParts.push({
      type: event.type,
      data: event.data,
    } as MessagePart);
  }

  /**
   * Mark the streaming as completed and flush any remaining text
   */
  complete(): void {
    this.flushTextBuffer();
    this._status = "completed";
  }

  /**
   * Get current MessagePart[] (returns finalized + current, O(1))
   */
  getParts(): MessagePart[] {
    return [...this.finalizedParts, ...this.currentTextParts];
  }

  /**
   * Get accumulated events (mainly for debugging)
   */
  getEvents(): WorkflowEvent[] {
    return [...this.events];
  }

  /**
   * Get current text buffer (mainly for debugging)
   */
  getTextBuffer(): string {
    return this.currentTextBuffer;
  }

  /**
   * Clear all accumulated state
   */
  clear(): void {
    this.events = [];
    this.currentTextBuffer = "";
    this.currentTextParts = [];
    this.finalizedParts = [];
    this._status = "streaming";
  }

  /**
   * Flush the current text buffer (finalize adjacent delta events)
   * This is called when a non-delta event arrives or streaming completes
   */
  private flushTextBuffer(): void {
    if (!this.currentTextBuffer.trim()) {
      return;
    }

    // Move current text parts to finalized
    this.finalizedParts.push(...this.currentTextParts);

    // Clear buffer and current parts (ready for next sequence of delta events)
    this.currentTextBuffer = "";
    this.currentTextParts = [];
  }
}