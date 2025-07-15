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
