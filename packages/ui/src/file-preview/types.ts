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
 * Visual styles for PDF highlights.
 * Most use the "inversion" principle - blurring/dimming surroundings.
 * "lens" is non-inverted - applies glass effect to the highlight itself.
 */
export type HighlightStyle =
  | "mist" // Light blur, barely tinted, very subtle
  | "haze" // Medium blur with slight warmth
  | "glass" // Inverted glassmorphism: blurred surroundings, specular edges
  | "loupe" // Magnifying glass: shadow ring, bright inner edge
  | "shadowBox" // Clean cutout with dramatic drop shadow
  | "dim" // Dark cinematic blur, dramatic focus
  | "sepia" // Warm blur, aged/archival feel
  | "frost" // Heavy inverted glassmorphism, frosted window
  | "lens"; // Non-inverted: glass effect ON the highlight itself
