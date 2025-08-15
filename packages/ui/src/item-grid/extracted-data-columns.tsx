import type { Column } from "./types";
import {
  ReviewStatusBadge,
  FormattedDate,
} from "./components/status-components";
import { ActionButton } from "./components/action-button";
import { toast } from "sonner";
import type {
  TypedAgentData,
  ExtractedData,
} from "llama-cloud-services/beta/agent";
import { STATUS_OPTIONS } from "./built-in-columns";
import { isLowConfidence } from "@/lib";

// Public list of extracted-data column names to preserve order and API surface
export const EXTRACTED_DATA_COLUMN_NAMES = [
  "fileName",
  "status",
  "itemsToReview",
  "createdAt",
  "actions",
] as const;
export type ExtractedDataColumnName =
  (typeof EXTRACTED_DATA_COLUMN_NAMES)[number];

// Helper: count low-confidence leaf metadata from extracted field metadata
// Leaf definition: an object that contains numeric `confidence` and has no nested object properties
export function getExtractedDataItemsToReviewCount<T>(
  item: TypedAgentData<ExtractedData<T>>
): number {
  const metadata = item.data.field_metadata;
  if (!metadata || typeof metadata !== "object") return 0;

  let lowConfidenceCount = 0;

  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    const obj = node as Record<string, unknown>;

    // Check leaf metadata: has confidence number and no nested object children
    const confidence = obj.confidence;
    const hasNestedObjectChild = Object.values(obj).some(
      (v) => v && typeof v === "object" && !Array.isArray(v)
    );

    if (typeof confidence === "number" && !hasNestedObjectChild) {
      if (isLowConfidence(confidence)) lowConfidenceCount++;
      return; // do not traverse deeper
    }

    // Otherwise traverse children
    Object.values(obj).forEach(visit);
  };

  visit(metadata);
  return lowConfidenceCount;
}

// Factory function to create a single extracted-data column by name
export function createExtractedDataColumn<T>(
  columnName: ExtractedDataColumnName,
  config: boolean | Partial<Column<ExtractedData<T>>>
): Column<ExtractedData<T>> {
  // Build base column by name
  let baseColumn: Column<ExtractedData<T>> | undefined;

  switch (columnName) {
    case "fileName":
      baseColumn = {
        key: "file_name",
        header: "File Name",
        getValue: (item: TypedAgentData<ExtractedData<T>>) =>
          item.data.file_name,
        sortable: true,
      };
      break;
    case "status":
      baseColumn = {
        key: "status",
        header: "Status",
        getValue: (item: TypedAgentData<ExtractedData<T>>) => item.data.status,
        renderCell: (value: unknown) => (
          <ReviewStatusBadge value={value as string} />
        ),
        filterable: true,
        filterOptions: STATUS_OPTIONS.map((option) => option.value),
        sortable: true,
      };
      break;
    case "itemsToReview":
      baseColumn = {
        key: "items_to_review",
        header: "Items to Review",
        getValue: (item: TypedAgentData<ExtractedData<T>>) =>
          getExtractedDataItemsToReviewCount(item),
        renderCell: (value: unknown) => {
          const count = value as number;
          return (
            <span className="text-base-foreground text-xs font-normal leading-none">
              {count}
            </span>
          );
        },
        sortable: false,
      };
      break;
    case "createdAt":
      baseColumn = {
        key: "created_at",
        header: "Created At",
        getValue: (item: TypedAgentData<ExtractedData<T>>) =>
          item.createdAt.toISOString(),
        renderCell: (value: unknown) => (
          <FormattedDate value={value as string} />
        ),
        sortable: true,
      };
      break;
    case "actions":
      baseColumn = {
        key: "actions",
        header: "",
        getValue: (item: TypedAgentData<ExtractedData<T>>) => item,
        renderCell: (value: unknown, hooks) => {
          if (!hooks?.deleteItem) {
            return null;
          }

          const item = value as TypedAgentData<ExtractedData<T>>;
          const deleteItem = hooks.deleteItem;

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
      };
      break;
  }

  if (!baseColumn) {
    throw new Error(`Unknown extracted-data column: ${columnName}`);
  }

  if (config === false) {
    throw new Error(`Column ${columnName} is disabled`);
  }

  if (config === true) {
    return baseColumn;
  }

  return { ...baseColumn, ...config };
}
