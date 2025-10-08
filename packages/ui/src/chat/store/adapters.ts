/**
 * Message ↔ Event Adapters
 * Pure functions for converting between chat messages and workflow events
 * Implements XML-based protocol for rich message parts
 */

import type { Message } from "../components/chat.interface";
import type { MessagePart, TextPart } from "../components/message-parts/types";
import {
  TextPartType,
  SourcesPartType,
  SuggestionPartType,
  ArtifactPartType,
  EventPartType,
} from "../components/message-parts/types";
import type {
  WorkflowEvent,
  ChatDeltaEvent,
  StopEvent,
  InputRequiredEvent,
  HumanResponseEvent,
} from "../../workflows/types";
import { WorkflowEventType } from "../../workflows/types";

/**
 * Extract text content from message parts
 * Concatenates all TextParts with space separator
 */
export function extractTextFromParts(parts: MessagePart[]): string {
  return parts
    .filter((part): part is TextPart => part.type === TextPartType)
    .map((part) => part.text)
    .join(" ");
}

/**
 * Determine if event is a ChatDeltaEvent
 */
export function isDeltaEvent(event: WorkflowEvent): event is ChatDeltaEvent {
  return event.type.includes("ChatDeltaEvent");
}

/**
 * Determine if event is a StopEvent (signals workflow completion)
 */
export function isStopEvent(event: WorkflowEvent): event is StopEvent {
  return event.type === WorkflowEventType.StopEvent;
}

/**
 * Determine if event is an InputRequiredEvent (signals waiting for user input)
 */
export function isInputRequiredEvent(
  event: WorkflowEvent
): event is InputRequiredEvent {
  return event.type === WorkflowEventType.InputRequiredEvent;
}

/**
 * Determine if event signals the end of a streaming message
 * (StopEvent or InputRequiredEvent)
 */
export function isMessageTerminator(event: WorkflowEvent): boolean {
  // For never-ending chat workflows, InputRequiredEvent marks the end of a turn
  // StopEvent should not be relied upon for chat; ignore it here
  return isInputRequiredEvent(event);
}

/**
 * Convert a chat Message to a WorkflowEvent
 *
 * @throws Error if message has no text content
 */
export function messageToEvent(message: Message): HumanResponseEvent {
  const text = extractTextFromParts(message.parts);

  if (!text || text.trim() === "") {
    throw new Error("Cannot send empty message");
  }

  return {
    type: WorkflowEventType.HumanResponseEvent,
    data: {
      response: text,
    },
  };
}

/**
 * Auto-complete unclosed markdown syntax for better streaming UX.
 *
 * Uses a stack to track unclosed markdown markers and auto-completes them at the end.
 * Handles: **, *, `, ```.
 *
 * @param text Raw markdown text (possibly incomplete during streaming)
 * @returns Text with auto-completed markdown syntax
 */
export function autoCompleteMarkdown(text: string): string {
  const stack: string[] = [];
  let i = 0;

  while (i < text.length) {
    const inFencedCode = stack[stack.length - 1] === "```";
    // Check for ``` (fenced code block)
    if (text.slice(i, i + 3) === "```") {
      if (stack[stack.length - 1] === "```") {
        stack.pop(); // Close fenced code block
      } else {
        stack.push("```"); // Open fenced code block
      }
      i += 3;
      continue;
    }

    // Check for ** (bold)
    if (text.slice(i, i + 2) === "**") {
      if (stack[stack.length - 1] === "**") {
        stack.pop(); // Close bold
      } else {
        stack.push("**"); // Open bold
      }
      i += 2;
      continue;
    }

    // Check for * (italic)
    if (text[i] === "*") {
      // Ignore * handling inside fenced code blocks
      if (inFencedCode) {
        i++;
        continue;
      }

      // Skip if it's part of ** (already handled above)
      if (text[i - 1] === "*") {
        i++;
        continue;
      }

      // Skip if it's part of * (already handled above)
      if (text[i + 1] === "*") {
        i++;
        continue;
      }

      // Skip if it's the last character, not sure if next character is *
      if (i === text.length - 1) {
        // If top of stack is *, we're pretty sure it's a complete italic
        if (stack[stack.length - 1] === "*") {
          stack.pop(); // Close italic
        }
        i++;
        continue;
      }

      if (stack[stack.length - 1] === "*") {
        stack.pop(); // Close italic
      } else {
        stack.push("*"); // Open italic
      }
      i++;
      continue;
    }

    // Check for ` (inline code)
    if (text[i] === "`") {
      // Ignore inline backtick handling inside fenced code blocks
      if (inFencedCode) {
        i++;
        continue;
      }

      // Skip if it's part of ``` (already handled above)
      if (text[i - 1] === "`" && text[i - 2] === "`") {
        i++;
        continue;
      }

      // Skip if next two chars are also `` (part of ```)
      if (text[i + 1] === "`" && text[i + 2] === "`") {
        i++;
        continue;
      }

      // Skip if it's part of *** (already handled above)
      if (text[i + 1] === "*" && text[i - 1] === "*") {
        i++;
        continue;
      }

      // Skip if it's the last character, not sure if next character is `
      if (i === text.length - 1) {
        // If top of stack is `, we're pretty sure it's a complete inline code
        if (stack[stack.length - 1] === "`") {
          stack.pop(); // Close inline code
        }
        i++;
        continue;
      }

      if (stack[stack.length - 1] === "`") {
        stack.pop(); // Close inline code
      } else {
        stack.push("`"); // Open inline code
      }
      i++;
      continue;
    }

    i++;
  }

  // Auto-complete: append closing markers in LIFO order (reverse of stack)
  let completedText = text;
  while (stack.length > 0) {
    const marker = stack.pop()!;
    if (marker === "```") {
      completedText += "\n";
    }
    completedText += marker;
  }

  return completedText;
}

/**
 * XML Protocol: Parse text containing XML markers into MessageParts.
 *
 * Streaming parsing strategy:
 * - Optimistic for markdown: show immediately (after auto-completion)
 * - Pessimistic for XML: wait for a complete closing tag
 * - Code-block aware: ignore XML-like tags inside fenced code blocks
 *
 * This prevents flickering when partial XML tags arrive during streaming.
 *
 * Supported markers:
 * - <sources>...</sources> → SourcesPart
 * - <suggested_questions>...</suggested_questions> → SuggestionPart
 * - <file>...</file> → FilePart
 * - <artifact>...</artifact> → ArtifactPart
 * - <event>...</event> → EventPart
 * - Plain text → TextPart
 *
 * See: /specs/001-use-chat/CHAT_PROTOCOL.md
 */
export function parseTextWithXMLMarkers(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const completedText = autoCompleteMarkdown(text);

  // 1) Code-block-aware ranges (avoid parsing XML inside code blocks)
  const codeBlockRanges = findCodeBlockRanges(completedText);

  // 2) Find complete XML markers
  const xmlPattern = /<(\w+)>([\s\S]*?)<\/\1>/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = xmlPattern.exec(completedText)) !== null) {
    const [fullMatch, tagName, content] = match;
    const matchStart = match.index;
    const matchEnd = matchStart + fullMatch.length;

    // Skip matches inside fenced code blocks
    if (isInsideCodeBlock(matchStart, matchEnd, codeBlockRanges)) {
      continue;
    }

    // 2.1 Append plain text before this match (already auto-completed)
    if (matchStart > lastIndex) {
      const plainText = completedText.slice(lastIndex, matchStart);
      const trimmed = plainText.trim();
      if (trimmed) {
        parts.push({ type: TextPartType, text: trimmed });
      }
    }

    // 2.2 Parse XML data block
    const part = parseXMLMarker(tagName, content.trim());
    if (part) {
      parts.push(part);
    }

    lastIndex = matchEnd;
  }

  // 3) Handle remaining tail text (pessimistic for incomplete XML at the very end)
  if (lastIndex < completedText.length) {
    const remaining = completedText.slice(lastIndex);

    const startTagMatch = remaining.match(/<(\w+)>/);
    if (startTagMatch) {
      const tagStartIndex = lastIndex + (startTagMatch.index || 0);
      // Use completedText.length to represent the range to the end
      if (
        !isInsideCodeBlock(tagStartIndex, completedText.length, codeBlockRanges)
      ) {
        const before = remaining.slice(0, startTagMatch.index);
        const trimmed = before.trim();
        if (trimmed) {
          parts.push({ type: TextPartType, text: trimmed });
        }
      } else {
        const trimmed = remaining.trim();
        if (trimmed) parts.push({ type: TextPartType, text: trimmed });
      }
    } else {
      const trimmed = remaining.trim();
      if (trimmed) parts.push({ type: TextPartType, text: trimmed });
    }
  }

  return parts;
}

/**
 * Find all code block regions (inline code and fenced code blocks)
 * Returns array of [start, end] positions
 *
 * Strategy: Process fenced blocks first, then inline code (excluding what's in fenced blocks)
 */
function findCodeBlockRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];

  // Find fenced code blocks (```...```)
  // Look for ``` at line start, then find matching closing ```
  const lines = text.split("\n");
  let currentIndex = 0;
  let inFencedBlock = false;
  let fenceStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = currentIndex;

    if (line.trim().startsWith("```")) {
      if (!inFencedBlock) {
        // Opening fence
        inFencedBlock = true;
        fenceStart = lineStart;
      } else {
        // Closing fence
        inFencedBlock = false;
        const fenceEnd = lineStart + line.length;
        ranges.push([fenceStart, fenceEnd]);
      }
    }

    currentIndex += line.length + 1; // +1 for newline
  }

  // Find inline code (`...`)
  // Only match single-line inline code, not multiline
  const inlinePattern = /`[^`\n]+`/g;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;

    // Only add if not already inside a fenced code block
    let isInFenced = false;
    for (const [blockStart, blockEnd] of ranges) {
      if (matchStart >= blockStart && matchEnd <= blockEnd) {
        isInFenced = true;
        break;
      }
    }

    if (!isInFenced) {
      ranges.push([matchStart, matchEnd]);
    }
  }

  return ranges;
}

/**
 * Check if a position range overlaps with any code block range
 */
function isInsideCodeBlock(
  start: number,
  end: number,
  codeBlockRanges: Array<[number, number]>
): boolean {
  for (const [blockStart, blockEnd] of codeBlockRanges) {
    // Check if the range overlaps with this code block
    if (start >= blockStart && start < blockEnd) {
      return true;
    }
    if (end > blockStart && end <= blockEnd) {
      return true;
    }
    if (start <= blockStart && end >= blockEnd) {
      return true;
    }
  }
  return false;
}

/**
 * Parse XML marker content into appropriate MessagePart
 * Returns null if parsing fails (graceful degradation)
 */
function parseXMLMarker(tagName: string, content: string): MessagePart | null {
  try {
    // Parse JSON content
    const data = JSON.parse(content);

    switch (tagName) {
      case "sources":
        return {
          type: SourcesPartType,
          data: data, // Expected: { nodes: SourceNode[] }
        };

      case "suggested_questions":
        return {
          type: SuggestionPartType,
          data: data, // Expected: string[]
        };

      case "artifact":
        return {
          type: ArtifactPartType,
          data: data, // Expected: { type, created_at, data }
        };

      case "event":
        return {
          type: EventPartType,
          data: data, // Expected: { title, status, description?, data? }
        };

      default:
        // Unknown tag: create AnyPart for extensibility
        return {
          type: tagName,
          data: data,
        };
    }
  } catch (error) {
    // JSON parsing failed: return null for graceful degradation
    // eslint-disable-next-line no-console
    console.warn(
      `[XML Protocol] Failed to parse <${tagName}> content:`,
      content,
      error
    );
    return null;
  }
}

/**
 * Convert a WorkflowEvent to MessagePart(s) and merge with current parts
 *
 * Protocol Implementation:
 * 1. Extract text from event
 * 2. Parse XML markers in text → MessageParts
 * 3. Merge with current parts (concatenate text, append data parts)
 *
 * Handles:
 * - Text events with XML markers: Parse and merge
 * - StopEvent: Return unchanged (signals completion)
 * - Other events: Append as AnyPart
 * - Malformed events: Skip silently
 */
export function eventToMessageParts(
  event: WorkflowEvent,
  currentParts: MessagePart[]
): MessagePart[] {
  // Skip malformed events
  if (!event || !event.type) {
    return currentParts;
  }

  // StopEvent: no display, return unchanged
  if (isStopEvent(event)) {
    return currentParts;
  }

  // Text events: extract text and parse XML markers
  if (isDeltaEvent(event)) {
    let text: string | undefined;

    // Extract text from ChatDeltaEvent data format
    if (event.data && typeof event.data === "object" && "delta" in event.data) {
      text = event.data.delta;
    }

    if (text !== undefined && text.trim()) {
      // Parse XML markers in the text
      const newParts = parseTextWithXMLMarkers(text);

      // Merge with current parts
      return mergeMessageParts(currentParts, newParts);
    }
  }

  // Other events: append as AnyPart for custom rendering
  return [
    ...currentParts,
    {
      type: event.type,
      data: event.data,
    } as MessagePart,
  ];
}

/**
 * Merge new parts into current parts
 *
 * Strategy:
 * - If first new part is TextPart: concatenate with first existing TextPart
 * - Otherwise: append all new parts
 * - Preserve all non-text parts from both arrays
 */
function mergeMessageParts(
  currentParts: MessagePart[],
  newParts: MessagePart[]
): MessagePart[] {
  if (newParts.length === 0) {
    return currentParts;
  }

  if (currentParts.length === 0) {
    return newParts;
  }

  // Find first TextPart in current parts
  const firstTextIndex = currentParts.findIndex(
    (part) => part.type === TextPartType
  );
  const firstNewPart = newParts[0];

  // If both have TextParts at the start, concatenate them
  if (firstTextIndex !== -1 && firstNewPart.type === TextPartType) {
    const updatedParts = [...currentParts];
    const currentTextPart = updatedParts[firstTextIndex] as TextPart;
    const newTextPart = firstNewPart as TextPart;

    // Concatenate text
    updatedParts[firstTextIndex] = {
      type: TextPartType,
      text: currentTextPart.text + newTextPart.text,
    };

    // Append remaining new parts (after the first TextPart)
    return [...updatedParts, ...newParts.slice(1)];
  }

  // Otherwise, just append all new parts
  return [...currentParts, ...newParts];
}
