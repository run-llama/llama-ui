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
 * Visual styles for PDF highlights
 */
export type HighlightStyle =
  | "classic" // Traditional yellow highlight
  | "liquidGlass" // Apple-inspired glassmorphism with shimmer
  | "lightbox" // Dark vignette with spotlight on highlighted area
  | "neon" // Glowing neon border effect
  | "underline" // Minimal underline below content
  | "outline" // Dashed outline, no fill
  | "gradient" // Animated gradient border
  | "spotlight"; // Radial light beam effect
