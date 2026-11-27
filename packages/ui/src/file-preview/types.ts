// Types for bounding box data
export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Clockwise degrees around the literal rectangle center. */
  rotation?: number | null;
  confidence?: number;
  label?: string;
  color?: string;
}

// Types for page data
export interface PageData {
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
  boundingBoxes: BoundingBox[];
}

export interface FileData {
  fileName: string;
  pages: PageData[];
  totalPages: number;
}

export interface Highlight {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Clockwise degrees around the literal rectangle center. */
  rotation?: number | null;
}

/**
 * How highlights are painted on a preview.
 * - "outline": a tinted box over each highlight.
 * - "spotlight": the whole document is veiled (faded and blurred) and only the
 *   highlighted areas stay sharp, each marked with a thin ring.
 */
export type HighlightStyle = "outline" | "spotlight";
