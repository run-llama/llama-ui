import type { JSONSchema } from "zod/v4/core";

export interface ExtractedDataDisplayProps {
  data: Record<string, unknown>;
  confidence?: Record<string, unknown>; // Support nested confidence structure
  title?: string;
  emptyMessage?: string;
  onChange?: (updatedData: Record<string, unknown>) => void;
  editable?: boolean;
  // Schema reconciliation - pass schema and let component handle reconciliation internally
  jsonSchema?: JSONSchema.ObjectSchema;
}
