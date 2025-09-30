import { describe, it, expect } from "vitest";
import {
  autoCompleteMarkdown,
  parseTextWithXMLMarkers,
} from "../../src/chat/store/adapters";

describe("autoCompleteMarkdown", () => {
  it("completes bold ** at end", () => {
    expect(autoCompleteMarkdown("This is **bol")).toBe("This is **bol**");
  });

  it("completes italic * at end", () => {
    expect(autoCompleteMarkdown("This is *ita")).toBe("This is *ita*");
  });

  it("completes inline code ` at end", () => {
    expect(autoCompleteMarkdown("Use `Array<T>")).toBe("Use `Array<T>`");
  });

  it("completes fenced code ``` at end", () => {
    const input = "```ts\nconsole.log(1)";
    const expected = "```ts\nconsole.log(1)\n```";
    expect(autoCompleteMarkdown(input)).toBe(expected);
  });

  it("completes nested in LIFO order", () => {
    const input = "**bold *italic";
    const expected = "**bold *italic***"; // first close *, then **
    expect(autoCompleteMarkdown(input)).toBe(expected);
  });

  it("handles mixed * and ** correctly", () => {
    // open **, then open *, close both in LIFO
    expect(autoCompleteMarkdown("**a *b")).toBe("**a *b***");
    // open *, then open **, close **, then *
    expect(autoCompleteMarkdown("*a **b")).toBe("*a **b***");
  });

  it("handles ` and ``` mixed without interference", () => {
    const input = "```ts\nconst x = 1;\n``` and `y`";
    expect(autoCompleteMarkdown(input)).toBe(input); // already complete
    // incomplete inline but fenced closed
    expect(autoCompleteMarkdown("```\ncode\n``` and `x")).toBe(
      "```\ncode\n``` and `x`"
    );
    // incomplete fenced but inline closed
    expect(autoCompleteMarkdown("```\ncode and `x`")).toBe(
      "```\ncode and `x`\n```"
    ); // will not add ``` here until stream end; autocomplete adds at end
  });

  it("ignores * and ` inside fenced code", () => {
    const input = "```\n*not italic* and `not code`\n```";
    expect(autoCompleteMarkdown(input)).toBe(input);
  });
});

describe("findCodeBlockRanges + parseTextWithXMLMarkers (integration)", () => {
  it("does not parse XML inside fenced code blocks", () => {
    const input = "```\n<sources>not xml</sources>\n```";
    const parts = parseTextWithXMLMarkers(input);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ type: "text" });
  });

  it("parses XML markers outside code blocks", () => {
    const input = 'answer\n\n<sources>\n{"nodes": []}\n</sources>';
    const parts = parseTextWithXMLMarkers(input);
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0]).toMatchObject({ type: "text" });
    expect(parts[1]).toMatchObject({ type: "data-sources" });
  });

  it("auto-completes markdown before parsing XML", () => {
    const input = 'This is \n```ts\n\n<sources>\n{"nodes": []}\n</sources>';
    const parts = parseTextWithXMLMarkers(input);
    expect(parts[0]).toMatchObject({ type: "text" });
    // @ts-expect-error - text exists on text part
    expect(parts[0].text).toBe(
      'This is \n```ts\n\n<sources>\n{"nodes": []}\n</sources>\n```'
    );
  });

  it("treats ` and ``` mixed correctly while parsing", () => {
    const input =
      '```\ninside *not* parsed\n``` and here is `code`\n<sources>\n{"nodes": []}\n</sources>';
    const parts = parseTextWithXMLMarkers(input);
    // Text before + sources; tail text is none, so at least 2 parts
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0]).toMatchObject({ type: "text" });
    expect(parts.some((p) => p.type === "data-sources")).toBe(true);
  });

  it("incomplete xml tags are not parsed", () => {
    const input = '<sources>\n{"nodes": []}\n</sour';
    const parts = parseTextWithXMLMarkers(input);
    expect(parts.length).toBe(0);
  });

  it("empty is empty", () => {
    const input = "";
    const parts = parseTextWithXMLMarkers(input);
    expect(parts.length).toBe(0);
  });
});
