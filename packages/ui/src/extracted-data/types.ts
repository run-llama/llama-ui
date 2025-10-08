import type { JSONSchema } from "zod/v4/core";
import type {
  PrimitiveValue,
  JsonObject,
  JsonValue,
  JsonShape,
} from "../lib/json-types";
import type {
  ExtractedData,
  ExtractedFieldMetadataDict,
  ExtractedFieldMetadata,
} from "llama-cloud-services/beta/agent";
import type { FieldSchemaMetadata } from "./schema-reconciliation";

export interface ExtractedDataDisplayProps<S extends JsonShape<S>> {
  extractedData: ExtractedData<S>;
  title?: string;
  emptyMessage?: string;
  onChange?: (updatedData: S) => void;
  editable?: boolean;
  // Schema reconciliation - pass schema and let component handle reconciliation internally
  jsonSchema?: JSONSchema.ObjectSchema;
  // Field click callback
  onClickField?: (args: {
    value: PrimitiveValue;
    metadata?: ExtractedFieldMetadata;
    path: string[];
  }) => void;
  tableRowsPerPage?: number;
  listItemsPerPage?: number;
}

// Convenience type used by renderers to carry both schema metadata and extracted metadata
export interface RendererMetadata {
  schema: Record<string, FieldSchemaMetadata>;
  extracted?: ExtractedFieldMetadataDict;
}

export type { PrimitiveValue, JsonObject, JsonValue, JsonShape };
