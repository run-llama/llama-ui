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

export interface HighlightScrollParams {
  /** Top offset of the page element relative to scroll container */
  pageTop: number;
  /** Height of the page in scaled pixels */
  pageHeight: number;
  /** Y position of highlight on page (unscaled) */
  highlightY: number;
  /** Height of highlight (unscaled) */
  highlightHeight: number;
  /** Current scale factor */
  scale: number;
  /** Height of the viewport/container */
  viewportHeight: number;
  /** Total scrollable height of container */
  scrollHeight: number;
  /** Minimum distance from viewport edge */
  minEdgeDistance: number;
}

/**
 * Calculates optimal scroll position to show a highlight.
 * Uses smart positioning that averages between centering the highlight
 * and centering the page, while ensuring minimum distance from viewport edges.
 *
 * @returns The target scrollTop value, or null if calculation cannot be performed
 */
export function calculateHighlightScrollPosition(
  params: HighlightScrollParams
): number {
  const {
    pageTop,
    pageHeight,
    highlightY,
    highlightHeight,
    scale,
    viewportHeight,
    scrollHeight,
    minEdgeDistance,
  } = params;

  // Calculate highlight bounds in scaled pixels relative to container
  const highlightTopAbsolute = pageTop + highlightY * scale;
  const highlightBottomAbsolute =
    pageTop + (highlightY + highlightHeight) * scale;
  const highlightCenterAbsolute =
    (highlightTopAbsolute + highlightBottomAbsolute) / 2;

  // Calculate page center for averaging
  const pageCenterAbsolute = pageTop + pageHeight / 2;

  // Scroll position to center the highlight in viewport
  const scrollToCenterHighlight = highlightCenterAbsolute - viewportHeight / 2;

  // Scroll position to center the page in viewport
  const scrollToCenterPage = pageCenterAbsolute - viewportHeight / 2;

  // Average the two positions (bias toward highlight)
  let targetScroll = (scrollToCenterHighlight + scrollToCenterPage) / 2;

  // Check where highlight ends up and enforce minimum edge distance
  const highlightTopInViewport = highlightTopAbsolute - targetScroll;
  const highlightBottomInViewport = highlightBottomAbsolute - targetScroll;

  if (highlightTopInViewport < minEdgeDistance) {
    // Highlight too close to top - scroll up (reduce scroll value)
    targetScroll = highlightTopAbsolute - minEdgeDistance;
  } else if (highlightBottomInViewport > viewportHeight - minEdgeDistance) {
    // Highlight too close to bottom - scroll down
    targetScroll = highlightBottomAbsolute - (viewportHeight - minEdgeDistance);
  }

  // Clamp to valid scroll range
  const maxScroll = scrollHeight - viewportHeight;
  return Math.max(0, Math.min(targetScroll, maxScroll));
}
