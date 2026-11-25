import type { BoundingBox, Highlight } from "./types";

/**
 * Converts highlights to bounding boxes grouped by page
 */
export function groupHighlightsByPage(highlights: Highlight[] | undefined): {
  [page: number]: BoundingBox[];
} {
  if (!highlights || highlights.length === 0) {
    return {};
  }

  const grouped: { [page: number]: BoundingBox[] } = {};
  highlights.forEach((highlight, idx) => {
    if (!grouped[highlight.page]) {
      grouped[highlight.page] = [];
    }
    grouped[highlight.page].push({
      id: `highlight-${highlight.page}-${idx}`,
      x: highlight.x,
      y: highlight.y,
      width: highlight.width,
      height: highlight.height,
      rotation: highlight.rotation,
      color: "rgba(255, 215, 0, 0.25)",
    });
  });
  return grouped;
}

/**
 * Calculates visible page range with buffer
 */
export function calculateVisiblePageRange(
  centerPage: number,
  totalPages: number,
  buffer: number
): number[] {
  const start = Math.max(1, centerPage - buffer);
  const end = Math.min(totalPages, centerPage + buffer);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

/**
 * Computes the scroll-top offset of a page within the scroll container, using a
 * cumulative height model. Pages are laid out top-to-bottom, each occupying its
 * measured height (or `estimatedPageHeight` if not yet rendered) plus `gap`.
 *
 * This is the source of truth for "where is page N" — it does not depend on the
 * page's DOM node being mounted, so it works for far jumps where the target page
 * has not rendered yet.
 */
export function scrollOffsetForPage(
  targetPage: number,
  pageHeights: { [key: number]: number },
  estimatedPageHeight: number,
  rangeStart: number,
  gap: number
): number {
  let offset = 0;
  for (let i = rangeStart; i < targetPage; i++) {
    offset += (pageHeights[i] || estimatedPageHeight) + gap;
  }
  return offset;
}

/**
 * Inverse of {@link scrollOffsetForPage}: given a scroll offset (e.g. the
 * vertical center of the viewport), returns the page number at that offset using
 * the same cumulative height model. Used to derive the current page from scroll
 * position without reading the DOM.
 */
export function pageFromScrollOffset(
  scrollOffset: number,
  pageHeights: { [key: number]: number },
  estimatedPageHeight: number,
  rangeStart: number,
  rangeEnd: number,
  gap: number
): number {
  let offset = 0;
  for (let i = rangeStart; i <= rangeEnd; i++) {
    const h = (pageHeights[i] || estimatedPageHeight) + gap;
    if (scrollOffset < offset + h) {
      return i;
    }
    offset += h;
  }
  return rangeEnd;
}

/**
 * Finds the closest page to the center of the viewport
 */
export function findClosestPage(
  pageRefs: { [key: number]: HTMLDivElement | null },
  containerRect: DOMRect
): number {
  const containerCenter = containerRect.top + containerRect.height / 2;
  let closestPage = 1;
  let closestDistance = Infinity;

  Object.entries(pageRefs).forEach(([pageNumber, element]) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      const pageCenter = rect.top + rect.height / 2;
      const distance = Math.abs(pageCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = parseInt(pageNumber);
      }
    }
  });

  return closestPage;
}

/**
 * How the PDF should fit within the container on initial load
 */
export type FitMode = "width" | "page";

/**
 * Calculates scale to fit PDF page in container width
 */
export function calculateFitToWidthScale(
  viewportWidth: number,
  containerWidth: number,
  padding: number = 16
): number {
  const availableWidth = containerWidth - padding;
  return availableWidth / viewportWidth;
}

/**
 * Calculates initial scale based on fit mode
 */
export function calculateInitialScale(
  fitMode: FitMode,
  viewport: { width: number; height: number },
  container: { width: number; height: number },
  padding: number = 16
): number {
  const availableWidth = container.width - padding;
  const availableHeight = container.height - padding;

  if (fitMode === "width") {
    return availableWidth / viewport.width;
  }

  // "page" mode - fit entire page in view
  const scaleToFitWidth = availableWidth / viewport.width;
  const scaleToFitHeight = availableHeight / viewport.height;
  return Math.min(scaleToFitWidth, scaleToFitHeight);
}

/**
 * `transform` attribute that turns a box clockwise around its own center, or
 * undefined for an upright box. Shared by everything that draws a box in page
 * units so outlines and spotlight holes rotate identically.
 */
export function boxRotationTransform(
  box: Pick<BoundingBox, "x" | "y" | "width" | "height" | "rotation">
): string | undefined {
  return box.rotation != null && box.rotation % 360 !== 0
    ? `rotate(${box.rotation} ${box.x + box.width / 2} ${box.y + box.height / 2})`
    : undefined;
}

// Axis-aligned extent of a box after its rotation, in the box's own units.
function rotatedExtent(
  box: Pick<BoundingBox, "x" | "y" | "width" | "height" | "rotation">
): { x: number; y: number; width: number; height: number } {
  const radians = ((box.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const width = box.width * cos + box.height * sin;
  const height = box.width * sin + box.height * cos;
  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  };
}

export interface HighlightScrollParams {
  /** Highlight in unscaled page units. */
  highlight: Pick<Highlight, "x" | "y" | "width" | "height" | "rotation">;
  /** Current scale factor (page units to CSS px). */
  scale: number;
  /** Page's top-left corner in scroll-content px (its position at scroll 0). */
  pageTop: number;
  pageLeft: number;
  /** Scroll position the container is at, or is already animating toward. */
  scrollTop: number;
  scrollLeft: number;
  viewportHeight: number;
  viewportWidth: number;
  scrollHeight: number;
  scrollWidth: number;
  /** A box closer than this to a viewport edge counts as out of view. */
  margin?: number;
}

const PAGE_TOP_GAP_PX = 16;

// Scroll offset for one axis: unchanged while the box sits inside the viewport
// (less `margin`), otherwise the offset that centers it, clamped to the range.
function axisScroll(
  boxStart: number,
  boxSize: number,
  scroll: number,
  viewportSize: number,
  scrollSize: number,
  margin: number
): number {
  const inView =
    boxStart >= scroll + margin &&
    boxStart + boxSize <= scroll + viewportSize - margin;
  if (inView) return scroll;
  // A box larger than the viewport is aligned to its leading edge.
  const lead = boxSize <= viewportSize ? (viewportSize - boxSize) / 2 : margin;
  const maxScroll = Math.max(0, scrollSize - viewportSize);
  return Math.max(0, Math.min(boxStart - lead, maxScroll));
}

/**
 * Decides whether the scroll container has to move to show a highlight.
 *
 * Returns null when the highlight (its rotated extent) is already fully inside
 * the viewport, so stepping between highlights that are both on screen leaves
 * the document still. Otherwise returns the scroll position that centers the
 * highlight on each axis where it is out of view, clamped to the scroll range.
 * Also null when that position is where the container already is.
 */
export function calculateHighlightScroll(
  params: HighlightScrollParams
): { top: number; left: number } | null {
  const { scale, margin = 8 } = params;
  const extent = rotatedExtent(params.highlight);

  const centeredTop = axisScroll(
    params.pageTop + extent.y * scale,
    extent.height * scale,
    params.scrollTop,
    params.viewportHeight,
    params.scrollHeight,
    margin
  );
  // A highlight near the top of its page would center with the previous page
  // filling the upper half; start at the highlight's own page instead.
  const maxTop = Math.max(0, params.scrollHeight - params.viewportHeight);
  const top =
    centeredTop === params.scrollTop
      ? centeredTop
      : Math.max(
          centeredTop,
          Math.min(params.pageTop - PAGE_TOP_GAP_PX, maxTop)
        );
  const left = axisScroll(
    params.pageLeft + extent.x * scale,
    extent.width * scale,
    params.scrollLeft,
    params.viewportWidth,
    params.scrollWidth,
    margin
  );

  const moves =
    Math.abs(top - params.scrollTop) >= 1 ||
    Math.abs(left - params.scrollLeft) >= 1;
  return moves ? { top, left } : null;
}

const SPOTLIGHT_PADDING_PX = 4;
const SPOTLIGHT_MIN_WIDTH_PX = 40;
const SPOTLIGHT_MIN_HEIGHT_PX = 18;

/**
 * Grows each highlight into the area a spotlight keeps sharp: padded by a few
 * CSS px and never smaller than a readable minimum, centered on the original
 * box. Sizes are CSS px converted to page units with `scale`, so the padding
 * looks the same at every zoom. Rotation is carried through unchanged.
 */
export function spotlightBoxes(
  boxes: BoundingBox[],
  scale: number
): BoundingBox[] {
  return boxes.map((box) => {
    const width = Math.max(
      box.width + (2 * SPOTLIGHT_PADDING_PX) / scale,
      SPOTLIGHT_MIN_WIDTH_PX / scale
    );
    const height = Math.max(
      box.height + (2 * SPOTLIGHT_PADDING_PX) / scale,
      SPOTLIGHT_MIN_HEIGHT_PX / scale
    );
    return {
      ...box,
      x: box.x + (box.width - width) / 2,
      y: box.y + (box.height - height) / 2,
      width,
      height,
    };
  });
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Builds the SVG used as a CSS mask for the spotlight veil: opaque everywhere
 * on the page except over the spotlight boxes, where it is transparent so the
 * veil lets the page show through sharp. The SVG uses the page's own units as
 * its viewBox and is stretched over the page by the caller.
 *
 * Returns null when there are no boxes; the veil then covers the whole page.
 */
export function buildSpotlightMaskSvg(
  boxes: BoundingBox[],
  page: { width: number; height: number },
  scale: number
): string | null {
  if (boxes.length === 0) return null;
  const radius = round(3 / scale);
  const holes = spotlightBoxes(boxes, scale)
    .map((box) => {
      const transform = boxRotationTransform(box);
      return (
        `<rect x="${round(box.x)}" y="${round(box.y)}" ` +
        `width="${round(box.width)}" height="${round(box.height)}" ` +
        `rx="${radius}" fill="black"` +
        (transform ? ` transform="${transform}"` : "") +
        "/>"
      );
    })
    .join("");
  const size = `width="${page.width}" height="${page.height}"`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.width} ${page.height}" preserveAspectRatio="none">` +
    `<mask id="holes"><rect ${size} fill="white"/>${holes}</mask>` +
    `<rect ${size} mask="url(#holes)"/>` +
    "</svg>"
  );
}
