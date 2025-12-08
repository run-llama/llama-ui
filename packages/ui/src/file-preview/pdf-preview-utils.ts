import type { BoundingBox, Highlight } from "./types";

/**
 * Generates warning message for page limit
 */
export function generatePageLimitWarning(
  numPages: number | undefined,
  displayMaxPages: number | undefined,
  maxPagesWarning: string | undefined
): string {
  if (!displayMaxPages || !numPages || numPages <= displayMaxPages) {
    return maxPagesWarning ?? "";
  }
  return (
    maxPagesWarning ??
    `The document has ${numPages} pages. Limiting the preview to ${displayMaxPages} pages to increase performance.`
  );
}

/**
 * Converts highlights to bounding boxes grouped by page
 */
export function groupHighlightsByPage(
  highlights: Highlight[] | undefined
): { [page: number]: BoundingBox[] } {
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
 * Calculates the effective number of pages considering page limits
 */
export function calculateEffectiveNumPages(
  numPages: number | undefined,
  displayMaxPages: number | undefined
): number | undefined {
  if (!numPages) return numPages;
  if (!displayMaxPages || !Number.isFinite(displayMaxPages) || displayMaxPages <= 0) {
    return numPages;
  }
  return Math.min(numPages, displayMaxPages);
}

/**
 * Calculates new max pages when extending page limit
 */
export function calculateExtendedMaxPages(
  currentMaxPages: number,
  totalPages: number,
  incrementAmount: number
): number {
  return Math.min(currentMaxPages + incrementAmount, totalPages);
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

