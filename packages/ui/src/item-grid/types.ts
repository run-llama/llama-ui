import type {
  ExtractedData,
  FilterOperation,
  TypedAgentData,
} from "llama-cloud-services/beta/agent";
import type { ReactNode } from "react";

// Types
export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  size: number;
}

export interface ItemGridHooks {
  deleteItem?: (
    itemId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export interface Column<T = unknown> {
  key: string;
  header: string;
  getValue: (item: TypedAgentData<ExtractedData<T>>) => unknown;
  renderCell?: (value: unknown, hooks?: ItemGridHooks) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
  filterable?: boolean;
  filterOptions?: string[];
}

export interface BuiltInColumnConfig<T = unknown> {
  fileName?: boolean | Partial<Column<T>>;
  status?: boolean | Partial<Column<T>>;
  createdAt?: boolean | Partial<Column<T>>;
  itemsToReview?: boolean | Partial<Column<T>>;
  actions?: boolean | Partial<Column<T>>;
}

export interface BusinessConfig {
  columns: Column[];
  filterFields: Record<string, FilterOperation>;
  defaultPageSize: number;
}
