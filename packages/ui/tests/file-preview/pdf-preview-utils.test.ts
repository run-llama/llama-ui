import { describe, it, expect } from "vitest";
import {
  generatePageLimitWarning,
  groupHighlightsByPage,
  calculateEffectiveNumPages,
  calculateExtendedMaxPages,
  calculateVisiblePageRange,
  findClosestPage,
  calculateFitToWidthScale,
} from "@/src/file-preview/pdf-preview-utils";
import type { Highlight } from "@/src/file-preview/types";

describe("generatePageLimitWarning", () => {
  it("returns empty string when numPages is undefined", () => {
    const result = generatePageLimitWarning(undefined, 25, undefined);
    expect(result).toBe("");
  });

  it("returns empty string when displayMaxPages is undefined", () => {
    const result = generatePageLimitWarning(100, undefined, undefined);
    expect(result).toBe("");
  });

  it("returns empty string when numPages is within limit", () => {
    const result = generatePageLimitWarning(20, 25, undefined);
    expect(result).toBe("");
  });

  it("returns custom warning when provided and numPages exceeds limit", () => {
    const customWarning = "Custom warning message";
    const result = generatePageLimitWarning(100, 25, customWarning);
    expect(result).toBe(customWarning);
  });

  it("returns default warning when numPages exceeds limit and no custom warning", () => {
    const result = generatePageLimitWarning(100, 25, undefined);
    expect(result).toBe(
      "The document has 100 pages. Limiting the preview to 25 pages to increase performance."
    );
  });

  it("returns custom warning even when within limit", () => {
    const customWarning = "Custom warning";
    const result = generatePageLimitWarning(10, 25, customWarning);
    expect(result).toBe(customWarning);
  });
});

describe("groupHighlightsByPage", () => {
  it("returns empty object when highlights is undefined", () => {
    const result = groupHighlightsByPage(undefined);
    expect(result).toEqual({});
  });

  it("returns empty object when highlights array is empty", () => {
    const result = groupHighlightsByPage([]);
    expect(result).toEqual({});
  });

  it("groups single highlight correctly", () => {
    const highlights: Highlight[] = [
      { page: 1, x: 10, y: 20, width: 100, height: 50 },
    ];
    const result = groupHighlightsByPage(highlights);
    expect(result).toEqual({
      1: [
        {
          id: "highlight-1-0",
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          color: "rgba(255, 215, 0, 0.25)",
        },
      ],
    });
  });

  it("groups multiple highlights on same page", () => {
    const highlights: Highlight[] = [
      { page: 1, x: 10, y: 20, width: 100, height: 50 },
      { page: 1, x: 30, y: 40, width: 80, height: 60 },
    ];
    const result = groupHighlightsByPage(highlights);
    expect(result[1]).toHaveLength(2);
    expect(result[1][0].id).toBe("highlight-1-0");
    expect(result[1][1].id).toBe("highlight-1-1");
  });

  it("groups highlights across multiple pages", () => {
    const highlights: Highlight[] = [
      { page: 1, x: 10, y: 20, width: 100, height: 50 },
      { page: 2, x: 30, y: 40, width: 80, height: 60 },
      { page: 1, x: 50, y: 60, width: 70, height: 40 },
    ];
    const result = groupHighlightsByPage(highlights);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result[1]).toHaveLength(2);
    expect(result[2]).toHaveLength(1);
  });
});

describe("calculateEffectiveNumPages", () => {
  it("returns undefined when numPages is undefined", () => {
    const result = calculateEffectiveNumPages(undefined, 25);
    expect(result).toBeUndefined();
  });

  it("returns numPages when displayMaxPages is undefined", () => {
    const result = calculateEffectiveNumPages(100, undefined);
    expect(result).toBe(100);
  });

  it("returns numPages when displayMaxPages is 0", () => {
    const result = calculateEffectiveNumPages(100, 0);
    expect(result).toBe(100);
  });

  it("returns numPages when displayMaxPages is negative", () => {
    const result = calculateEffectiveNumPages(100, -5);
    expect(result).toBe(100);
  });

  it("returns numPages when displayMaxPages is Infinity", () => {
    const result = calculateEffectiveNumPages(100, Infinity);
    expect(result).toBe(100);
  });

  it("returns numPages when numPages is less than displayMaxPages", () => {
    const result = calculateEffectiveNumPages(20, 25);
    expect(result).toBe(20);
  });

  it("returns displayMaxPages when numPages exceeds limit", () => {
    const result = calculateEffectiveNumPages(100, 25);
    expect(result).toBe(25);
  });

  it("returns numPages when equal to displayMaxPages", () => {
    const result = calculateEffectiveNumPages(25, 25);
    expect(result).toBe(25);
  });
});

describe("calculateExtendedMaxPages", () => {
  it("extends max pages by increment amount", () => {
    const result = calculateExtendedMaxPages(25, 100, 25);
    expect(result).toBe(50);
  });

  it("caps at total pages when increment would exceed", () => {
    const result = calculateExtendedMaxPages(90, 100, 25);
    expect(result).toBe(100);
  });

  it("returns total pages when already at max", () => {
    const result = calculateExtendedMaxPages(100, 100, 25);
    expect(result).toBe(100);
  });

  it("handles small increment amounts", () => {
    const result = calculateExtendedMaxPages(10, 100, 5);
    expect(result).toBe(15);
  });
});

describe("calculateVisiblePageRange", () => {
  it("calculates range for page in middle of document", () => {
    const result = calculateVisiblePageRange(50, 100, 2);
    expect(result).toEqual([48, 49, 50, 51, 52]);
  });

  it("clamps start to 1 for first pages", () => {
    const result = calculateVisiblePageRange(1, 100, 2);
    expect(result).toEqual([1, 2, 3]);
  });

  it("clamps end to totalPages for last pages", () => {
    const result = calculateVisiblePageRange(99, 100, 2);
    expect(result).toEqual([97, 98, 99, 100]);
  });

  it("handles single page document", () => {
    const result = calculateVisiblePageRange(1, 1, 2);
    expect(result).toEqual([1]);
  });

  it("handles buffer larger than document", () => {
    const result = calculateVisiblePageRange(3, 5, 10);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles zero buffer", () => {
    const result = calculateVisiblePageRange(50, 100, 0);
    expect(result).toEqual([50]);
  });
});

describe("findClosestPage", () => {
  // Create mock elements with getBoundingClientRect
  const createMockElement = (top: number, height: number): HTMLDivElement => {
    return {
      getBoundingClientRect: () => ({
        top,
        height,
        bottom: top + height,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }),
    } as HTMLDivElement;
  };

  const createContainerRect = (top: number, height: number): DOMRect => ({
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 500,
    width: 500,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });

  it("returns 1 when pageRefs is empty", () => {
    const result = findClosestPage({}, createContainerRect(0, 500));
    expect(result).toBe(1);
  });

  it("returns page closest to container center", () => {
    const pageRefs = {
      1: createMockElement(0, 800),
      2: createMockElement(800, 800),
      3: createMockElement(1600, 800),
    };
    // Container center is at 250 (0 + 500/2)
    // Page 1 center is at 400 (0 + 800/2) - distance 150
    // Page 2 center is at 1200 (800 + 800/2) - distance 950
    const result = findClosestPage(pageRefs, createContainerRect(0, 500));
    expect(result).toBe(1);
  });

  it("handles null elements in pageRefs", () => {
    const pageRefs = {
      1: null,
      2: createMockElement(0, 800),
      3: null,
    };
    const result = findClosestPage(pageRefs, createContainerRect(0, 500));
    expect(result).toBe(2);
  });

  it("returns correct page when scrolled down", () => {
    const pageRefs = {
      1: createMockElement(-800, 800),
      2: createMockElement(0, 800),
      3: createMockElement(800, 800),
    };
    // Container center is at 250
    // Page 1 center is at -400 - distance 650
    // Page 2 center is at 400 - distance 150
    // Page 3 center is at 1200 - distance 950
    const result = findClosestPage(pageRefs, createContainerRect(0, 500));
    expect(result).toBe(2);
  });
});

describe("calculateFitToWidthScale", () => {
  it("calculates scale with default padding", () => {
    // Container 800px, viewport 612px (standard letter), default padding 16px
    // (800 - 16) / 612 = 1.281...
    const result = calculateFitToWidthScale(612, 800);
    expect(result).toBeCloseTo(1.281, 2);
  });

  it("calculates scale with custom padding", () => {
    // Container 800px, viewport 612px, padding 32px
    // (800 - 32) / 612 = 1.255...
    const result = calculateFitToWidthScale(612, 800, 32);
    expect(result).toBeCloseTo(1.255, 2);
  });

  it("calculates scale with zero padding", () => {
    // Container 800px, viewport 612px, padding 0
    // 800 / 612 = 1.307...
    const result = calculateFitToWidthScale(612, 800, 0);
    expect(result).toBeCloseTo(1.307, 2);
  });

  it("returns scale less than 1 for wide viewport", () => {
    // Container 500px, viewport 800px, default padding 16px
    // (500 - 16) / 800 = 0.605
    const result = calculateFitToWidthScale(800, 500);
    expect(result).toBeCloseTo(0.605, 2);
  });

  it("returns 1 when viewport equals available width", () => {
    // Container 628px, viewport 612px, default padding 16px
    // (628 - 16) / 612 = 1.0
    const result = calculateFitToWidthScale(612, 628);
    expect(result).toBe(1);
  });
});

