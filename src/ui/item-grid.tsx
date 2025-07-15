// Re-export from the new modular structure
export { ItemGrid } from "./item-grid/item-grid";

// Export types for backward compatibility
export type {
  SortDirection,
  SortState,
  PaginationState,
  Column,
  BusinessConfig,
} from "./item-grid/types";
