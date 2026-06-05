import { describe, it, expect } from "vitest";
import {
  groupHighlightsByPage,
  calculateVisiblePageRange,
  findClosestPage,
  calculateFitToWidthScale,
  calculateInitialScale,
  calculateHighlightScrollPosition,
  scrollOffsetForPage,
  pageFromScrollOffset,
} from "@/src/file-preview/pdf-preview-utils";
import type { Highlight } from "@/src/file-preview/types";

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

describe("calculateInitialScale", () => {
  it("calculates width fit scale correctly", () => {
    // Container 800x600, viewport 612x792 (standard letter)
    // Available width = 800 - 16 = 784
    // Scale = 784 / 612 = 1.281...
    const result = calculateInitialScale(
      "width",
      { width: 612, height: 792 },
      { width: 800, height: 600 }
    );
    expect(result).toBeCloseTo(1.281, 2);
  });

  it("calculates page fit scale when height is limiting factor", () => {
    // Container 800x400, viewport 612x792 (standard letter)
    // Available width = 800 - 16 = 784, scale = 784/612 = 1.281
    // Available height = 400 - 16 = 384, scale = 384/792 = 0.485
    // Page fit should use the smaller scale (height-limited)
    const result = calculateInitialScale(
      "page",
      { width: 612, height: 792 },
      { width: 800, height: 400 }
    );
    expect(result).toBeCloseTo(0.485, 2);
  });

  it("calculates page fit scale when width is limiting factor", () => {
    // Container 400x800, viewport 612x792 (standard letter)
    // Available width = 400 - 16 = 384, scale = 384/612 = 0.627
    // Available height = 800 - 16 = 784, scale = 784/792 = 0.990
    // Page fit should use the smaller scale (width-limited)
    const result = calculateInitialScale(
      "page",
      { width: 612, height: 792 },
      { width: 400, height: 800 }
    );
    expect(result).toBeCloseTo(0.627, 2);
  });

  it("uses custom padding correctly in width mode", () => {
    // Container 800x600, viewport 612x792, padding 32px
    // Available width = 800 - 32 = 768
    // Scale = 768 / 612 = 1.255...
    const result = calculateInitialScale(
      "width",
      { width: 612, height: 792 },
      { width: 800, height: 600 },
      32
    );
    expect(result).toBeCloseTo(1.255, 2);
  });

  it("uses custom padding correctly in page mode", () => {
    // Container 800x400, viewport 612x792, padding 32px
    // Available width = 800 - 32 = 768, scale = 768/612 = 1.255
    // Available height = 400 - 32 = 368, scale = 368/792 = 0.465
    // Page fit should use the smaller scale
    const result = calculateInitialScale(
      "page",
      { width: 612, height: 792 },
      { width: 800, height: 400 },
      32
    );
    expect(result).toBeCloseTo(0.465, 2);
  });

  it("returns same result for width and page mode when page fits exactly", () => {
    // Container where width scale equals height scale
    // viewport 100x100, container 116x116 (with 16px padding -> 100x100 available)
    const widthResult = calculateInitialScale(
      "width",
      { width: 100, height: 100 },
      { width: 116, height: 116 }
    );
    const pageResult = calculateInitialScale(
      "page",
      { width: 100, height: 100 },
      { width: 116, height: 116 }
    );
    expect(widthResult).toBe(1);
    expect(pageResult).toBe(1);
  });

  it("handles landscape viewport in page mode", () => {
    // Landscape viewport 792x612 in container 600x800
    // Available width = 600 - 16 = 584, scale = 584/792 = 0.737
    // Available height = 800 - 16 = 784, scale = 784/612 = 1.281
    // Page fit should use width-limited scale
    const result = calculateInitialScale(
      "page",
      { width: 792, height: 612 },
      { width: 600, height: 800 }
    );
    expect(result).toBeCloseTo(0.737, 2);
  });

  it("handles zero padding", () => {
    // Container 800x600, viewport 800x600, padding 0
    // Both scales should be exactly 1.0
    const result = calculateInitialScale(
      "page",
      { width: 800, height: 600 },
      { width: 800, height: 600 },
      0
    );
    expect(result).toBe(1);
  });

  it("returns scale less than 1 for large viewport", () => {
    // Small container 400x300, large viewport 800x600
    // Available width = 400 - 16 = 384, scale = 384/800 = 0.48
    // Available height = 300 - 16 = 284, scale = 284/600 = 0.473
    // Height is limiting
    const result = calculateInitialScale(
      "page",
      { width: 800, height: 600 },
      { width: 400, height: 300 }
    );
    expect(result).toBeCloseTo(0.473, 2);
  });

  it("width mode ignores container height", () => {
    // Same container width, different heights should give same result
    const result1 = calculateInitialScale(
      "width",
      { width: 612, height: 792 },
      { width: 800, height: 400 }
    );
    const result2 = calculateInitialScale(
      "width",
      { width: 612, height: 792 },
      { width: 800, height: 1000 }
    );
    expect(result1).toBe(result2);
  });
});

describe("calculateHighlightScrollPosition", () => {
  const baseParams = {
    pageTop: 0,
    pageHeight: 800,
    highlightY: 400,
    highlightHeight: 50,
    scale: 1,
    viewportHeight: 600,
    scrollHeight: 1200,
    minEdgeDistance: 60,
  };

  it("centers highlight when in middle of page", () => {
    const result = calculateHighlightScrollPosition(baseParams);
    // Highlight center at 425, page center at 400
    // scrollToCenterHighlight = 425 - 300 = 125
    // scrollToCenterPage = 400 - 300 = 100
    // average = 112.5
    expect(result).toBe(112.5);
  });

  it("respects minimum edge distance for highlight at top of page", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      highlightY: 10,
      highlightHeight: 30,
    });
    // Highlight top at 10, should be at least 60px from top of viewport
    // So scroll should be at most 10 - 60 = -50, clamped to 0
    expect(result).toBe(0);
  });

  it("respects minimum edge distance for highlight at bottom of page", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      pageTop: 0,
      pageHeight: 800,
      highlightY: 750,
      highlightHeight: 40,
      viewportHeight: 400,
      scrollHeight: 1000,
    });
    // Highlight bottom at 790
    // Should be at least 60px from bottom of viewport (400 - 60 = 340)
    // So highlight bottom should be at scroll + 340
    // scroll = 790 - 340 = 450
    expect(result).toBe(450);
  });

  it("applies scale correctly", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      scale: 2,
      pageHeight: 1600, // 800 * 2 (already scaled)
      scrollHeight: 2400,
    });
    // At scale 2:
    // Highlight top = 0 + 400 * 2 = 800
    // Highlight bottom = 0 + (400 + 50) * 2 = 900
    // Highlight center = 850
    // Page center = 800
    // scrollToCenterHighlight = 850 - 300 = 550
    // scrollToCenterPage = 800 - 300 = 500
    // average = 525
    expect(result).toBe(525);
  });

  it("clamps to minimum scroll (0)", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      pageTop: 0,
      highlightY: 0,
      highlightHeight: 20,
    });
    // Would result in negative scroll, should be clamped to 0
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("clamps to maximum scroll", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      pageTop: 800,
      pageHeight: 800,
      highlightY: 700,
      scrollHeight: 1000,
      viewportHeight: 400,
    });
    // Max scroll = 1000 - 400 = 600
    expect(result).toBeLessThanOrEqual(600);
  });

  it("handles highlight taller than viewport", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      highlightY: 200,
      highlightHeight: 500, // Taller than viewport (600)
      viewportHeight: 400,
    });
    // Should still produce a valid scroll value
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(baseParams.scrollHeight - 400);
  });

  it("handles page at non-zero offset", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      pageTop: 500, // Page starts 500px down
      highlightY: 100,
    });
    // Highlight absolute position = 500 + 100 = 600
    // Highlight center = 625
    // Page center = 500 + 400 = 900
    // Calculation should account for pageTop offset
    expect(result).toBeGreaterThan(0);
  });

  it("handles very small viewport", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      viewportHeight: 100,
      minEdgeDistance: 10,
    });
    // Should still work with small viewport
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("handles zero scroll height edge case", () => {
    const result = calculateHighlightScrollPosition({
      ...baseParams,
      scrollHeight: 600, // Same as viewport, no scrolling possible
      viewportHeight: 600,
    });
    // Max scroll = 0, should clamp to 0
    expect(result).toBe(0);
  });
});

describe("scrollOffsetForPage", () => {
  it("returns 0 for the first page in range", () => {
    expect(scrollOffsetForPage(1, {}, 800, 1, 16)).toBe(0);
  });

  it("returns 0 for the first page when range starts above 1", () => {
    // With a pageRange starting at page 5, page 5 is at the top.
    expect(scrollOffsetForPage(5, {}, 800, 5, 16)).toBe(0);
  });

  it("uses the estimate for pages with no measured height", () => {
    // 3 pages above target, each (800 + 16 gap) = 816 → 2448
    expect(scrollOffsetForPage(4, {}, 800, 1, 16)).toBe(2448);
  });

  it("uses measured heights when available, estimate otherwise", () => {
    // page1 = 900, page2 = 700, page3 = estimate 800; each + 16 gap
    // (900+16) + (700+16) + (800+16) = 916 + 716 + 816 = 2448
    const pageHeights = { 1: 900, 2: 700 };
    expect(scrollOffsetForPage(4, pageHeights, 800, 1, 16)).toBe(2448);
  });

  it("only counts pages from rangeStart upward", () => {
    // rangeStart = 5: pages 1-4 are not part of the layout and must be ignored.
    // Pages 5,6,7 above target 8 → 3 * (800 + 16) = 2448
    const pageHeights = { 1: 5000, 2: 5000 }; // below range, must be ignored
    expect(scrollOffsetForPage(8, pageHeights, 800, 5, 16)).toBe(2448);
  });

  it("handles zero gap", () => {
    expect(scrollOffsetForPage(4, {}, 800, 1, 0)).toBe(2400);
  });
});

describe("pageFromScrollOffset", () => {
  it("returns rangeStart at offset 0", () => {
    expect(pageFromScrollOffset(0, {}, 800, 1, 100, 16)).toBe(1);
  });

  it("returns rangeStart for a pageRange at offset 0", () => {
    expect(pageFromScrollOffset(0, {}, 800, 3, 100, 16)).toBe(3);
  });

  it("returns the page whose band contains the offset", () => {
    // Uniform 816px bands: page 1 = [0, 816), page 2 = [816, 1632)
    expect(pageFromScrollOffset(100, {}, 800, 1, 100, 16)).toBe(1);
    expect(pageFromScrollOffset(815, {}, 800, 1, 100, 16)).toBe(1);
    expect(pageFromScrollOffset(816, {}, 800, 1, 100, 16)).toBe(2);
  });

  it("clamps to rangeEnd beyond the document", () => {
    expect(pageFromScrollOffset(10_000_000, {}, 800, 1, 100, 16)).toBe(100);
  });

  it("respects measured heights", () => {
    // page1 = 1000 (+16 gap) → band [0, 1016); page 2 starts at 1016
    const pageHeights = { 1: 1000 };
    expect(pageFromScrollOffset(1015, pageHeights, 800, 1, 100, 16)).toBe(1);
    expect(pageFromScrollOffset(1016, pageHeights, 800, 1, 100, 16)).toBe(2);
  });

  it("round-trips with scrollOffsetForPage", () => {
    // The top offset of page N should map back to page N.
    const pageHeights = { 1: 900, 2: 700, 3: 850 };
    for (const page of [1, 2, 4, 7]) {
      const offset = scrollOffsetForPage(page, pageHeights, 800, 1, 16);
      expect(pageFromScrollOffset(offset, pageHeights, 800, 1, 100, 16)).toBe(
        page
      );
    }
  });
});
