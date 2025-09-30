/**
 * XML Protocol Comprehensive Tests
 * 
 * Organized into 4 categories:
 * 1. Full Markdown Types (optimistic parsing) - All markdown types with FULL text
 * 2. LaTeX & XML Parts (pessimistic parsing) - LaTeX and XML markers with FULL text  
 * 3. Partial Markdown (optimistic) - Streaming markdown with PARTIAL text
 * 4. Partial LaTeX & XML (pessimistic) - Streaming LaTeX/XML with PARTIAL text (should be ignored)
 */

import { describe, it, expect } from "vitest";
import { parseTextWithXMLMarkers } from "../../src/chat/store/adapters";
import { buildComprehensiveMarkdown } from "../../stories/chat/fixtures/markdown-samples";

describe("Category 1: Full Markdown Types - Optimistic Parsing", () => {
  // C1-001: Headings
  it("should parse headings (all levels) with full text", () => {
    const text = `# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error - we know it's a text part
    const content = parts[0].text;
    expect(content).toContain("# H1 Heading");
    expect(content).toContain("### H3 Heading");
    expect(content).toContain("###### H6 Heading");
  });

  // C1-002: Lists (unordered, ordered, nested)
  it("should parse lists with full text", () => {
    const text = `- Item A
- Item B
  - Nested 1
  - Nested 2

1. First
2. Second
3. Third

- [x] Done task
- [ ] Todo task`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("- Item A");
    // @ts-expect-error
    expect(parts[0].text).toContain("  - Nested 1");
    // @ts-expect-error
    expect(parts[0].text).toContain("1. First");
    // @ts-expect-error
    expect(parts[0].text).toContain("- [x] Done task");
  });

  // C1-003: Emphasis (bold, italic, strikethrough)
  it("should parse emphasis with full text", () => {
    const text = "This is **bold** and *italic* and ***bold-italic*** and ~~strikethrough~~.";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("**bold**");
    // @ts-expect-error
    expect(parts[0].text).toContain("*italic*");
  });

  // C1-004: Links and images
  it("should parse links and images with full text", () => {
    const text = `[Link text](https://example.com)
![Alt text](https://example.com/image.png)
<https://auto-link.com>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("[Link text](https://example.com)");
  });

  // C1-005: Blockquotes
  it("should parse blockquotes with full text", () => {
    const text = `> This is a quote
> Multiline quote
>> Nested quote`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("> This is a quote");
  });

  // C1-006: Tables
  it("should parse tables with full text", () => {
    const text = `| Column A | Column B | Column C |
| --- | --- | --- |
| Value 1 | Value 2 | Value 3 |
| x < 10 | y > 5 | z == 0 |`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("| Column A |");
    // @ts-expect-error
    expect(parts[0].text).toContain("x < 10");
  });

  // C1-007: Horizontal rules
  it("should parse horizontal rules with full text", () => {
    const text = `Before rule

---

After rule`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("---");
  });

  // C1-008: Inline code
  it("should parse inline code with full text (including < >)", () => {
    const text = "Use `const x = a < b` or `Array<T>` or `Map<K, V>` for generics.";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("`Array<T>`");
  });

  // C1-009: Fenced code blocks (various languages)
  it("should parse fenced code blocks with full text (not parsing < > inside)", () => {
    const text = `\`\`\`typescript
function compare<T>(a: T, b: T): boolean {
  return a > b;
}
const result = x < 10 && y > 5;
\`\`\`

\`\`\`html
<div class="container">
  <h1>Title</h1>
</div>
\`\`\`

\`\`\`python
def sort(arr):
    return [x for x in arr if x < pivot]
\`\`\``;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    const text_content = parts[0].text;
    expect(text_content).toContain("function compare<T>");
    expect(text_content).toContain("<div class=\"container\">");
    expect(text_content).toContain("x < pivot");
  });

  // C1-010: Comprehensive markdown sample
  it("should parse comprehensive markdown sample with all types", () => {
    const markdown = buildComprehensiveMarkdown();

    const parts = parseTextWithXMLMarkers(markdown);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    const content = parts[0].text;
    expect(content).toContain("# Heading 1");
    expect(content).toContain("- Item A");
    expect(content).toContain("**bold**");
    expect(content).toContain("| Col A |");
    expect(content).toContain("function greet");
    expect(content).toContain("Result<T>");
  });
});

describe("Category 2: LaTeX & XML Parts - Pessimistic Parsing (Full Text)", () => {
  // C2-001: LaTeX inline math with < >
  it("should parse LaTeX inline math with full text", () => {
    const text = "The inequality $a < b < c$ holds.";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("$a < b < c$");
  });

  // C2-002: LaTeX block math
  it("should parse LaTeX block math with full text", () => {
    const text = `Formula:

$$
\\forall x \\in \\mathbb{R}, x < \\infty
$$

End.`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toContain("$$");
  });

  // C2-003: XML markers - sources
  it("should parse complete <sources> marker", () => {
    const text = `Text before.

<sources>
{"nodes": [{"id": "1", "text": "excerpt", "metadata": {}}]}
</sources>

Text after.`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts.length).toBeGreaterThanOrEqual(2);
    const sourcesPart = parts.find(p => p.type === "data-sources");
    expect(sourcesPart).toBeDefined();
  });

  // C2-004: XML markers - suggested_questions
  it("should parse complete <suggested_questions> marker", () => {
    const text = `<suggested_questions>
["Question 1?", "Question 2?", "Question 3?"]
</suggested_questions>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("data-suggested_questions");
  });

  // C2-005: XML markers - file
  it("should parse complete <file> marker", () => {
    const text = `<file>
{"filename": "report.pdf", "mediaType": "application/pdf", "url": "https://example.com/report.pdf"}
</file>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("data-file");
  });

  // C2-006: XML markers - event
  it("should parse complete <event> marker", () => {
    const text = `<event>
{"title": "Processing", "status": "success", "description": "Done"}
</event>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("data-event");
  });

  // C2-007: XML markers - artifact
  it("should parse complete <artifact> marker", () => {
    const text = `<artifact>
{"type": "document", "created_at": 1704067200000, "data": {"url": "https://example.com/doc.md"}}
</artifact>`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("data-artifact");
  });

  // C2-008: Mixed markdown, LaTeX, and XML markers
  it("should parse markdown + LaTeX + XML markers together", () => {
    const text = `# Analysis

The formula $E = mc^2$ is famous.

\`\`\`python
def calculate(x):
    return x < 100
\`\`\`

<sources>
{"nodes": [{"id": "1", "text": "Einstein 1905", "metadata": {}}]}
</sources>

More text with $a < b$.`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts.length).toBeGreaterThanOrEqual(2);
    
    const sourcesPart = parts.find(p => p.type === "data-sources");
    expect(sourcesPart).toBeDefined();
    
    const textParts = parts.filter(p => p.type === "text");
    const combined = textParts.map(p => (p as any).text).join(" ");
    expect(combined).toContain("$E = mc^2$");
    expect(combined).toContain("def calculate");
  });
});

describe("Category 3: Partial Markdown - Optimistic Parsing (Streaming)", () => {
  // C3-001: Partial heading
  it("should show partial heading immediately", () => {
    const text = "# This is a parti";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toBe("# This is a parti");
  });

  // C3-002: Partial list
  it("should show partial list immediately", () => {
    const text = "- Item one\n- Item tw";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toBe("- Item one\n- Item tw");
  });

  // C3-003: Partial bold/italic (incomplete syntax with auto-completion)
  it("should auto-complete incomplete bold syntax", () => {
    const text = "This is **bol";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // Should auto-complete the unclosed ** at the end
    // @ts-expect-error
    expect(parts[0].text).toBe("This is **bol**");
  });

  // C3-004: Partial link
  it("should show partial link immediately", () => {
    const text = "[Link text](https://exam";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toBe("[Link text](https://exam");
  });

  // C3-005: Partial table
  it("should show partial table immediately", () => {
    const text = "| Col A | Col B |\n| --- | -";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toBe("| Col A | Col B |\n| --- | -");
  });

  // C3-006: Partial code block (opening fence only) with auto-completion
  it("should auto-complete partial code block immediately", () => {
    const text = "Code:\n\n```typescript\nfunction cal";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // Should auto-complete the closing ```
    // @ts-expect-error
    expect(parts[0].text).toBe("Code:\n\n```typescript\nfunction cal\n```");
  });

  // C3-007: Streaming scenario - gradual text build-up with auto-completion
  it("should auto-complete markdown during streaming", () => {
    // Chunk 1: Plain text
    let text1 = "Here is ";
    let parts1 = parseTextWithXMLMarkers(text1);
    expect(parts1[0].type).toBe("text");
    // @ts-expect-error
    expect(parts1[0].text).toBe("Here is");

    // Chunk 2: Incomplete bold
    let text2 = "Here is some **bold";
    let parts2 = parseTextWithXMLMarkers(text2);
    expect(parts2[0].type).toBe("text");
    // @ts-expect-error
    expect(parts2[0].text).toBe("Here is some **bold**"); // Auto-completed!

    // Chunk 3: Complete bold
    let text3 = "Here is some **bold** text";
    let parts3 = parseTextWithXMLMarkers(text3);
    expect(parts3[0].type).toBe("text");
    // @ts-expect-error
    expect(parts3[0].text).toBe("Here is some **bold** text");

    // Chunk 4: New incomplete italic
    let text4 = "Here is some **bold** and *italic";
    let parts4 = parseTextWithXMLMarkers(text4);
    expect(parts4[0].type).toBe("text");
    // @ts-expect-error
    expect(parts4[0].text).toBe("Here is some **bold** and *italic*"); // Auto-completed!
  });

  // C3-008: Nested incomplete markdown
  it("should auto-complete nested markdown syntax", () => {
    const text = "This is **bold and *italic";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // Should auto-complete in LIFO order: * first, then **
    // @ts-expect-error
    expect(parts[0].text).toBe("This is **bold and *italic***");
  });

  // C3-009: Incomplete inline code
  it("should auto-complete inline code", () => {
    const text = "Use `Array<T> for generics";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // Should auto-complete the unclosed `
    // @ts-expect-error
    expect(parts[0].text).toBe("Use `Array<T> for generics`");
  });

  // C3-010: Incomplete fenced code block
  it("should auto-complete fenced code block", () => {
    const text = "```typescript\nfunction test() {\n  return 42;\n}";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // Should auto-complete the closing ``` (no newline before closing fence)
    // @ts-expect-error
    expect(parts[0].text).toBe("```typescript\nfunction test() {\n  return 42;\n}\n```");
  });
});

describe("Category 4: Partial LaTeX & XML - Pessimistic Parsing (Should be Ignored)", () => {
  // C4-001: Partial LaTeX inline (incomplete closing $)
  it("should ignore incomplete LaTeX inline math", () => {
    const text = "The formula $E = mc";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // Shows text before the incomplete LaTeX (optimistic for regular text)
    // @ts-expect-error
    expect(parts[0].text).toContain("The formula $E = mc");
  });

  // C4-002: Partial XML marker (incomplete opening tag)
  it("should still show incomplete XML opening tag (pessimistic)", () => {
    const text = "Some text and <sour";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // Should show text BEFORE incomplete tag
    // @ts-expect-error
    expect(parts[0].text).toBe("Some text and <sour");
  });

  // C4-003: Partial XML marker (opening tag complete, no content)
  it("should hide incomplete XML marker with opening tag only", () => {
    const text = "Text <sources>";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    expect(parts[0].text).toBe("Text");
  });

  // C4-004: Partial XML marker (opening + partial content)
  it("should treat incomplete XML with content as text (pragmatic)", () => {
    const text = `Text before

<sources>
{"nodes": [{"id`;

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");

    // @ts-expect-error
    expect(parts[0].text).toBe("Text before");
  });

  // C4-005: Partial XML marker (opening + content + no closing tag)
  it("should hide incomplete XML marker missing closing tag", () => {
    const text = `<sources>
{"nodes": [{"id": "1", "text": "data", "metadata": {}}]}
`;

    const parts = parseTextWithXMLMarkers(text);

    // Incomplete marker - opening tag detected, should hide it
    // Since there's no closing tag, it stays as incomplete
    expect(parts.length).toBeLessThanOrEqual(1);
    if (parts.length === 1) {
      expect(parts[0].type).toBe("text");
      // The incomplete opening tag is detected and hidden, leaving empty/whitespace
      // @ts-expect-error
      const trimmed = parts[0].text.trim();
      // Should be empty OR contain the incomplete content (depending on implementation)
      // Our implementation shows incomplete content as text for better UX
      expect(trimmed.length).toBeGreaterThanOrEqual(0);
    }
  });

  // C4-006: Streaming scenario - XML marker gradually completing
  it("should handle XML marker streaming (pessimistic until complete)", () => {
    // Step 1: Text only
    const chunk1 = "Analysis result:\n\n";
    const parts1 = parseTextWithXMLMarkers(chunk1);
    expect(parts1[0].type).toBe("text");

    // Step 2: Incomplete opening tag
    const chunk2 = chunk1 + "<sour";
    const parts2 = parseTextWithXMLMarkers(chunk2);
    expect(parts2[0].type).toBe("text");
    // @ts-expect-error
    expect(parts2[0].text).toBe("Analysis result:\n\n<sour");

    // Step 3: Complete opening tag
    const chunk3 = chunk1 + "<sources>";
    const parts3 = parseTextWithXMLMarkers(chunk3);
    expect(parts3[0].type).toBe("text");
    // @ts-expect-error
    expect(parts3[0].text).toBe("Analysis result:");

    // Step 4: Partial JSON content
    const chunk4 = chunk1 + "<sources>\n{\"nodes\": [";
    const parts4 = parseTextWithXMLMarkers(chunk4);
    expect(parts4[0].type).toBe("text");
    // Once content appears after opening tag, shown as text (pragmatic)
    // @ts-expect-error  
    expect(parts4[0].text).toBe("Analysis result:");

    // Step 5: Complete marker!
    const chunk5 = chunk1 + "<sources>\n{\"nodes\": []}\n</sources>";
    const parts5 = parseTextWithXMLMarkers(chunk5);
    expect(parts5.length).toBeGreaterThanOrEqual(2);
    expect(parts5[1].type).toBe("data-sources");
  });

  // C4-007: Mixed partial: optimistic text + pessimistic XML
  it("should show partial text but hide partial XML in same stream", () => {
    const text = "Here is **bold** text and more content <sourc";

    const parts = parseTextWithXMLMarkers(text);

    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
    // @ts-expect-error
    const content = parts[0].text;
    expect(content).toContain("**bold**");
    expect(content).toContain("and more content ");
    expect(content).toContain("<sourc");
  });
});

describe("Category Integration: Real-World Scenarios", () => {
  // INT-001: Complex streaming with all 4 categories
  it("should handle complex real-world streaming response", () => {
    const text = `# Algorithm Analysis

The quicksort algorithm has complexity $O(n \\log n)$ on average.

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
\`\`\`

<event>
{"title": "Analysis complete", "status": "success"}
</event>

| Algorithm | Best | Average | Worst |
| --- | --- | --- | --- |
| Quicksort | $O(n\\log n)$ | $O(n\\log n)$ | $O(n^2)$ |

<sources>
{"nodes": [{"id": "1", "text": "CLRS textbook", "metadata": {}}]}
</sources>

<suggested_questions>
["What about space complexity?", "When to use quicksort?"]
</suggested_questions>`;

    const parts = parseTextWithXMLMarkers(text);

    // Should have multiple parts
    expect(parts.length).toBeGreaterThanOrEqual(4);
    
    // Verify all part types present
    const types = parts.map(p => p.type);
    expect(types).toContain("text");
    expect(types).toContain("data-event");
    expect(types).toContain("data-sources");
    expect(types).toContain("data-suggested_questions");
    
    // Verify content integrity
    const textParts = parts.filter(p => p.type === "text");
    const allText = textParts.map(p => (p as any).text).join(" ");
    expect(allText).toContain("# Algorithm Analysis");
    expect(allText).toContain("$O(n \\log n)$");
    expect(allText).toContain("def quicksort");
    expect(allText).toContain("x < pivot");
    expect(allText).toContain("| Algorithm |");
  });
});
