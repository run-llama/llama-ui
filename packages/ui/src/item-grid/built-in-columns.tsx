import type { Column } from "./types";
import {
  ReviewStatusBadge,
  FormattedDate,
} from "./components/status-components";
import { ActionButton } from "./components/action-button";
import { isLowConfidence } from "@/lib";
import { toast } from "sonner";
import type {
  ExtractedData,
  TypedAgentData,
} from "@llamaindex/cloud/beta/agent";

// Status enum values
export const STATUS_OPTIONS = [
  { value: "pending_review", label: "In Review" },
  { value: "approved", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

export type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

// Helper function to calculate count of low confidence items to review
// TODO: revisit this function after entity level confidence is implemented
function getItemsToReviewCount(item: ExtractedData): number {
  if (!item.confidence) return 0;

  let lowConfidenceCount = 0;

  // Recursively check confidence scores in all fields
  function checkConfidence(obj: object): void {
    for (const value of Object.values(obj)) {
      if (value === null || value === undefined) continue;
      if (typeof value === "number" && isLowConfidence(value)) {
        lowConfidenceCount++;
      } else if (typeof value === "object") {
        checkConfidence(value);
      }
    }
  }

  checkConfidence(item.confidence);
  return lowConfidenceCount;
}

// Built-in column definition with name and configuration
export interface BuiltInColumnDef {
  name: string;
  column: Column;
}

// Built-in columns array configuration (with controlled order)
export const BUILT_IN_COLUMNS: BuiltInColumnDef[] = [
  {
    name: "fileName",
    column: {
      key: "file_name",
      header: "File Name",
      getValue: (item: TypedAgentData<ExtractedData>) => item.data.file_name,
      sortable: true,
    },
  },
  {
    name: "status",
    column: {
      key: "status",
      header: "Status",
      getValue: (item: TypedAgentData<ExtractedData>) => item.data.status,
      renderCell: (value: unknown) => (
        <ReviewStatusBadge value={value as string} />
      ),
      filterable: true,
      filterOptions: STATUS_OPTIONS.map((option) => option.value),
      sortable: true,
    },
  },
  {
    name: "itemsToReview",
    column: {
      key: "items_to_review",
      header: "Items to Review",
      getValue: (item: TypedAgentData<ExtractedData>) =>
        getItemsToReviewCount(item.data),
      renderCell: (value: unknown) => {
        const count = value as number;
        return (
          <span className="text-base-foreground text-xs font-normal leading-none">
            {count}
          </span>
        );
      },
      sortable: false,
    },
  },
  {
    name: "createdAt",
    column: {
      key: "created_at",
      header: "Created At",
      getValue: (item: TypedAgentData<ExtractedData>) => item.createdAt,
      renderCell: (value: unknown) => <FormattedDate value={value as string} />,
      sortable: true,
    },
  },
  {
    name: "actions",
    column: {
      key: "actions",
      header: "",
      getValue: (item: TypedAgentData<ExtractedData>) => item,
      renderCell: (value: unknown, hooks) => {
        const item = value as TypedAgentData<ExtractedData>;

        const deleteItem = hooks?.deleteItem;
        if (!deleteItem) {
          return null;
        }

        return (
          <ActionButton
            onDelete={async () => {
              const result = await deleteItem(item.id);
              if (!result.success && result.error) {
                toast.error(result.error);
              }
            }}
          />
        );
      },
    },
  },
];

// Create a lookup map for quick access
export const BUILT_IN_COLUMNS_MAP = BUILT_IN_COLUMNS.reduce(
  (acc, def) => {
    acc[def.name] = def.column;
    return acc;
  },
  {} as Record<string, Column<unknown>>,
);

// Factory function to create built-in columns
export function createBuiltInColumn<T = unknown>(
  columnName: string,
  config: boolean | Partial<Column<T>>,
): Column<T> {
  const baseColumn = BUILT_IN_COLUMNS_MAP[columnName];

  if (!baseColumn) {
    throw new Error(`Unknown built-in column: ${columnName}`);
  }

  if (config === true) {
    return baseColumn as Column<T>;
  }

  if (config === false) {
    throw new Error(`Column ${columnName} is disabled`);
  }

  // Merge configuration
  return {
    ...(baseColumn as Column<T>),
    ...config,
  };
}
