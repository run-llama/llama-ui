import type {
  AgentDataItem,
  AgentDataSearchParams,
} from "@/src/lib/agent-data";
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
    itemId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export interface Column {
  key: string;
  header: string;
  getValue: (item: AgentDataItem) => unknown;
  renderCell?: (value: unknown, hooks?: ItemGridHooks) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
  filterable?: boolean;
  filterOptions?: string[];
}

export interface BuiltInColumnConfig {
  fileName?: boolean | Partial<Column>;
  status?: boolean | Partial<Column>;
  createdAt?: boolean | Partial<Column>;
  itemsToReview?: boolean | Partial<Column>;
  actions?: boolean | Partial<Column>;
}

export interface BusinessConfig {
  columns: Column[];
  filterFields: Record<string, AgentDataSearchParams.Filter>;
  defaultPageSize: number;
}
