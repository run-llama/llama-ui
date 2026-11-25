import { describe, it, expect } from "vitest";
import {
  groupHighlightsByPage,
  calculateVisiblePageRange,
  findClosestPage,
  calculateFitToWidthScale,
  calculateInitialScale,
  calculateHighlightScroll,
  buildSpotlightMaskSvg,
  scrollOffsetForPage,
  pageFromScrollOffset,
} from "@/src/file-preview/pdf-preview-utils";
import type { BoundingBox, Highlight } from "@/src/file-preview/types";

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

describe("calculateHighlightScroll", () => {
  // One 600x800 page at the top-left of a 800x600 viewport, 2000px of content.
  const base = {
    scale: 1,
    pageTop: 0,
    pageLeft: 0,
    scrollTop: 0,
    scrollLeft: 0,
    viewportHeight: 600,
    viewportWidth: 800,
    scrollHeight: 2000,
    scrollWidth: 800,
  };
  const box = (y: number, height = 50) => ({ x: 100, y, width: 200, height });

  it("leaves the document still when the highlight is fully on screen", () => {
    // Catches: the pane jumping while the user hovers between visible fields.
    expect(
      calculateHighlightScroll({ ...base, highlight: box(100) })
    ).toBeNull();
    expect(
      calculateHighlightScroll({ ...base, highlight: box(400) })
    ).toBeNull();
  });

  it("centers a highlight that is cut off by the bottom edge", () => {
    // Catches: a half-hidden source treated as visible. 580 - (600 - 50) / 2.
    expect(calculateHighlightScroll({ ...base, highlight: box(580) })).toEqual({
      top: 305,
      left: 0,
    });
  });

  it("centers a highlight that is above the viewport", () => {
    // Catches: only checking the bottom edge. 400 - (600 - 50) / 2.
    expect(
      calculateHighlightScroll({
        ...base,
        scrollTop: 1000,
        highlight: box(400),
      })
    ).toEqual({ top: 125, left: 0 });
  });

  it("treats a highlight touching the viewport edge as out of view", () => {
    // Catches: a box flush against the edge (bottom at 596 of 600) left there.
    expect(
      calculateHighlightScroll({ ...base, highlight: box(546) })
    ).not.toBeNull();
    expect(
      calculateHighlightScroll({ ...base, highlight: box(540) })
    ).toBeNull();
  });

  it("clamps the target to the top of the scroll range", () => {
    // Catches: a negative scrollTop for a highlight near the document start.
    expect(
      calculateHighlightScroll({ ...base, scrollTop: 500, highlight: box(20) })
    ).toEqual({ top: 0, left: 0 });
  });

  it("clamps the target to the bottom of the scroll range", () => {
    // Catches: scrolling past the end. Max scroll is 2000 - 600.
    expect(
      calculateHighlightScroll({ ...base, highlight: box(1950, 40) })
    ).toEqual({ top: 1400, left: 0 });
  });

  it("does not ask for a scroll to where the container already is", () => {
    // Catches: endless no-op scrolls for a box in the top margin at scroll 0.
    expect(calculateHighlightScroll({ ...base, highlight: box(2) })).toBeNull();
  });

  it("applies the scale to the highlight", () => {
    // Catches: comparing unscaled page units against viewport px. At 2x the
    // box spans 700..800, below the 600px fold: 700 - (600 - 100) / 2.
    const highlight = box(350);
    expect(calculateHighlightScroll({ ...base, highlight })).toBeNull();
    expect(calculateHighlightScroll({ ...base, scale: 2, highlight })).toEqual({
      top: 450,
      left: 0,
    });
  });

  it("navigates to a one-unit go-to-page highlight on a far page", () => {
    // Catches: degenerate {x:0, y:0, width:1, height:1} callers losing
    // navigation. 3000 - (600 - 1) / 2, inside the 4000 - 600 scroll range.
    expect(
      calculateHighlightScroll({
        ...base,
        pageTop: 3000,
        scrollHeight: 4000,
        highlight: { x: 0, y: 0, width: 1, height: 1 },
      })
    ).toEqual({ top: 2700.5, left: 0 });
  });

  it("centers horizontally only when the highlight is off to the side", () => {
    // Catches: a zoomed-in page keeping its highlight off screen to the right.
    // 1000 - (800 - 200) / 2; the vertical position is fine and stays put.
    expect(
      calculateHighlightScroll({
        ...base,
        scrollWidth: 1600,
        highlight: { x: 1000, y: 100, width: 200, height: 50 },
      })
    ).toEqual({ top: 0, left: 700 });
  });

  it("uses the rotated extent of the highlight", () => {
    // Catches: a 300x20 box turned 90 degrees judged by its unrotated 20px
    // height. Rotated it spans 360..660 around its center: 360 - 150.
    const highlight = { x: 100, y: 500, width: 300, height: 20 };
    expect(calculateHighlightScroll({ ...base, highlight })).toBeNull();
    expect(
      calculateHighlightScroll({
        ...base,
        highlight: { ...highlight, rotation: 90 },
      })
    ).toEqual({ top: 210, left: 0 });
  });
});

describe("buildSpotlightMaskSvg", () => {
  const page = { width: 600, height: 800 };
  const boxOf = (overrides: Partial<BoundingBox> = {}): BoundingBox => ({
    id: "a",
    x: 100,
    y: 200,
    width: 300,
    height: 100,
    ...overrides,
  });
  // Holes are the black shapes inside the SVG's mask.
  const holes = (svg: string | null) =>
    [
      ...new DOMParser()
        .parseFromString(svg!, "image/svg+xml")
        .querySelectorAll('mask rect[fill="black"]'),
    ].map((rect) => ({
      x: Number(rect.getAttribute("x")),
      y: Number(rect.getAttribute("y")),
      width: Number(rect.getAttribute("width")),
      height: Number(rect.getAttribute("height")),
      transform: rect.getAttribute("transform"),
    }));

  it("returns no mask when the page has no highlights", () => {
    // Catches: a page without highlights getting a hole (or an empty mask
    // that hides the veil) when it should be fully veiled.
    expect(buildSpotlightMaskSvg([], page, 1)).toBeNull();
  });

  it("pads each hole by 4 CSS px at any zoom", () => {
    // Catches: the hole clipping the text it is meant to keep sharp, or the
    // padding growing with zoom. 4px is 4 page units at 1x and 2 at 2x.
    expect(holes(buildSpotlightMaskSvg([boxOf()], page, 1))).toEqual([
      { x: 96, y: 196, width: 308, height: 108, transform: null },
    ]);
    expect(holes(buildSpotlightMaskSvg([boxOf()], page, 2))).toEqual([
      { x: 98, y: 198, width: 304, height: 104, transform: null },
    ]);
  });

  it("grows a tiny highlight to 40x18 CSS px around its center", () => {
    // Catches: a one-character source leaving a pinhole, or the minimum box
    // growing from the corner so the hole misses the source.
    const tiny = boxOf({ width: 10, height: 4 });
    expect(holes(buildSpotlightMaskSvg([tiny], page, 1))).toEqual([
      { x: 85, y: 193, width: 40, height: 18, transform: null },
    ]);
    expect(holes(buildSpotlightMaskSvg([tiny], page, 2))).toEqual([
      { x: 95, y: 197.5, width: 20, height: 9, transform: null },
    ]);
  });

  it("rotates the hole around the highlight's center", () => {
    // Catches: an upright hole over a rotated source.
    expect(
      holes(buildSpotlightMaskSvg([boxOf({ rotation: 30 })], page, 1))[0]
        .transform
    ).toBe("rotate(30 250 250)");
  });

  it("cuts one hole per highlight in the page's own units", () => {
    // Catches: holes dropped for multi-box sources, or a viewBox that does
    // not match the page so holes land in the wrong place when stretched.
    const svg = buildSpotlightMaskSvg(
      [boxOf(), boxOf({ id: "b", y: 500 })],
      page,
      1.5
    );
    expect(holes(svg)).toHaveLength(2);
    const root = new DOMParser().parseFromString(
      svg!,
      "image/svg+xml"
    ).documentElement;
    expect(root.getAttribute("viewBox")).toBe("0 0 600 800");
    expect(root.getAttribute("preserveAspectRatio")).toBe("none");
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
