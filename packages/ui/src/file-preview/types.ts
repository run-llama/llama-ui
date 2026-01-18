// Types for bounding box data
export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
}

/**
 * Visual styles for PDF highlights - all use the "inversion" principle,
 * dimming surroundings to draw focus rather than overlaying the content.
 */
export type HighlightStyle =
  | "veil" // Subtle gray wash, barely perceptible
  | "sepia" // Warm aged paper tone, timeless
  | "loupe" // Magnifying glass with edge shadow, clean center
  | "frost" // Frosted glass on surroundings (inverted glassmorphism)
  | "parchment" // Aged paper effect, scholarly feel
  | "inkWash" // Deep blue-black like watercolor ink
  | "ember" // Warm glow like reading by firelight
  | "depth"; // Strong focus effect, dramatic but refined
