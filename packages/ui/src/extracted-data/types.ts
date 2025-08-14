import type { JSONSchema } from "zod/v4/core";
import type { ExtractedData, ExtractedFieldMetadataDict } from "llama-cloud-services/beta/agent";
import type { FieldMetadata } from "./schema-reconciliation";

export interface ExtractedDataDisplayProps {
  extractedData: ExtractedData;
  title?: string;
  emptyMessage?: string;
  onChange?: (updatedData: Record<string, unknown>) => void;
  editable?: boolean;
  // Schema reconciliation - pass schema and let component handle reconciliation internally
  jsonSchema?: JSONSchema.ObjectSchema;
}

// Convenience type used by renderers to carry both schema metadata and extracted metadata
export interface RendererMetadata {
  schema: Record<string, FieldMetadata>;
  extracted?: ExtractedFieldMetadataDict;
}
