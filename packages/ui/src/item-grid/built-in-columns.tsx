import type { Column } from "./types";
// Status enum values
export const STATUS_OPTIONS = [
  { value: "pending_review", label: "In Review" },
  { value: "approved", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

export type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

// Built-in column definition with name and configuration
export interface BuiltInColumnDef<T = unknown> {
  name: string;
  column: Column<T>;
}
