/**
 * XML Protocol Tests
 * Tests for XML marker parsing (parseTextWithXMLMarkers)
 * Based on /specs/001-use-chat/CHAT_PROTOCOL.md
 */

import { describe, it, expect } from "vitest";
import { parseTextWithXMLMarkers } from "../../src/chat/store/adapters";

describe("XML Protocol - parseTextWithXMLMarkers", () => {
  // Test: Plain text (no markers)
  it("should return text as single TextPart when no markers", () => {
    const text = "This is plain text with no markers.";
    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toEqual([
      { type: "text", text: "This is plain text with no markers." },
    ]);
  });

  // Test: Sources marker
  it("should parse <sources> marker into SourcesPart", () => {
    const text = `Here's some info.

<sources>
{"nodes": [{"id": "1", "text": "excerpt", "url": "https://example.com", "metadata": {"title": "Paper"}}]}
</sources>

More text.`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(3);
    expect(parts[0]).toEqual({ type: "text", text: "Here's some info." });
    expect(parts[1]).toMatchObject({
      type: "data-sources",
      data: {
        nodes: [{
          id: "1",
          text: "excerpt",
          url: "https://example.com",
          metadata: { title: "Paper" },
        }],
      },
    });
    expect(parts[2]).toEqual({ type: "text", text: "More text." });
  });

  // Test: Suggested questions marker
  it("should parse <suggested_questions> marker into SuggestionPart", () => {
    const text = `I hope this helps!

<suggested_questions>
["How does X work?", "What about Y?", "Tell me more?"]
</suggested_questions>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(2);
    expect(parts[0]).toEqual({ type: "text", text: "I hope this helps!" });
    expect(parts[1]).toEqual({
      type: "data-suggested_questions",
      data: ["How does X work?", "What about Y?", "Tell me more?"],
    });
  });

  // Test: File marker
  it("should parse <file> marker into FilePart", () => {
    const text = `<file>
{"filename": "report.pdf", "mediaType": "application/pdf", "url": "https://storage/report.pdf"}
</file>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({
      type: "data-file",
      data: {
        filename: "report.pdf",
        mediaType: "application/pdf",
        url: "https://storage/report.pdf",
      },
    });
  });

  // Test: Artifact marker
  it("should parse <artifact> marker into ArtifactPart", () => {
    const text = `<artifact>
{"type": "document", "created_at": 1704067200000, "data": {"url": "https://storage/doc.md", "title": "Analysis"}}
</artifact>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({
      type: "data-artifact",
      data: {
        type: "document",
        created_at: 1704067200000,
        data: {
          url: "https://storage/doc.md",
          title: "Analysis",
        },
      },
    });
  });

  // Test: Event marker
  it("should parse <event> marker into EventPart", () => {
    const text = `<event>
{"title": "Searching databases", "status": "success", "description": "Found 10 results"}
</event>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({
      type: "data-event",
      data: {
        title: "Searching databases",
        status: "success",
        description: "Found 10 results",
      },
    });
  });

  // Test: Multiple markers
  it("should parse multiple markers in sequence", () => {
    const text = `Analysis complete.

<event>
{"title": "Done", "status": "success"}
</event>

Here are the sources:

<sources>
{"nodes": [{"id": "1", "text": "...", "metadata": {}}]}
</sources>

<suggested_questions>
["Question 1?", "Question 2?"]
</suggested_questions>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(5);
    expect(parts[0].type).toBe("text");
    expect(parts[1].type).toBe("data-event");
    expect(parts[2].type).toBe("text");
    expect(parts[3].type).toBe("data-sources");
    expect(parts[4].type).toBe("data-suggested_questions");
  });

  // Test: Invalid JSON (graceful degradation)
  it("should skip marker with invalid JSON", () => {
    const text = `Text before.

<sources>
{ invalid json }
</sources>

Text after.`;

    const parts = parseTextWithXMLMarkers(text);

    // Should only have text parts, invalid marker is skipped
    expect(parts).toHaveLength(2);
    expect(parts[0]).toEqual({ type: "text", text: "Text before." });
    expect(parts[1]).toEqual({ type: "text", text: "Text after." });
  });

  // Test: Unknown marker type
  it("should create AnyPart for unknown marker types", () => {
    const text = `<custom_type>
{"foo": "bar"}
</custom_type>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({
      type: "custom_type",
      data: { foo: "bar" },
    });
  });

  // Test: Nested text with markers
  it("should handle text interleaved with markers", () => {
    const text = `Start text.
<event>{"title": "Step 1", "status": "success"}</event>
Middle text.
<event>{"title": "Step 2", "status": "success"}</event>
End text.`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(5);
    expect(parts[0].type).toBe("text");
    expect(parts[1].type).toBe("data-event");
    expect(parts[2].type).toBe("text");
    expect(parts[3].type).toBe("data-event");
    expect(parts[4].type).toBe("text");
  });

  // Test: Incomplete XML tag (pessimistic parsing)
  it("should NOT parse incomplete opening tag (pessimistic)", () => {
    const text = "Here is some text and then <sources";

    const parts = parseTextWithXMLMarkers(text);

    // Incomplete tag is shown as-is (will be properly parsed when complete)
    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({
      type: "text",
      text: "Here is some text and then <sources",
    });
  });

  // Test: Incomplete XML tag with closing bracket
  it("should NOT parse incomplete tag with opening bracket (pessimistic)", () => {
    const text = "Text before <sources>";

    const parts = parseTextWithXMLMarkers(text);

    // Incomplete tag is shown as-is
    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({
      type: "text",
      text: "Text before",
    });
  });

  // Test: Streaming scenario - incomplete then complete
  it("should handle streaming: incomplete tag then complete tag", () => {
    // Stream chunk 1: Text with incomplete tag
    const chunk1 = "Analysis complete.\n\n<sour";
    const parts1 = parseTextWithXMLMarkers(chunk1);
    
    expect(parts1).toHaveLength(1);
    expect(parts1[0]).toEqual({
      type: "text",
      text: "Analysis complete.\n\n<sour",
    });

    // Stream chunk 2: Complete accumulated text with full tag
    const chunk2 = "Analysis complete.\n\n<sources>\n{\"nodes\": []}\n</sources>";
    const parts2 = parseTextWithXMLMarkers(chunk2);
    
    expect(parts2).toHaveLength(2);
    expect(parts2[0].type).toBe("text");
    expect(parts2[1].type).toBe("data-sources");
  });

  // Test: Preserve spaces for streaming concatenation
  it("should handle trailing spaces", () => {
    const text = "Hello ";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({
      type: "text",
      text: "Hello",
    });
  });
});

// Note: eventToMessageParts tests removed - functionality moved to StreamingMessage class
// See: streaming-message.test.ts for event accumulation and parsing tests
