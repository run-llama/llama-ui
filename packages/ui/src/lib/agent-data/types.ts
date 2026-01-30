import type LlamaCloud from "@llamaindex/llama-cloud";

/**
 * Status types for agent data processing
 */
export const StatusType = {
  ERROR: "error",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  PENDING_REVIEW: "pending_review",
} as const;

export type StatusType = (typeof StatusType)[keyof typeof StatusType];

/**
 * Bounding box coordinates for a citation location on a page
 */
export interface BoundingBox {
  /** X coordinate of the bounding box origin */
  x: number;
  /** Y coordinate of the bounding box origin */
  y: number;
  /** Width of the bounding box */
  w: number;
  /** Height of the bounding box */
  h: number;
}

/**
 * Dimensions of a page in the source document
 */
export interface PageDimensions {
  /** Width of the page */
  width: number;
  /** Height of the page */
  height: number;
}

/**
 * Citation information for an extracted field
 */
export interface FieldCitation {
  /** The page number that the field occurred on */
  page?: number;
  /** The original text this field's value was derived from */
  matching_text?: string;
  /** Bounding boxes indicating where the citation appears on the page */
  bounding_boxes?: BoundingBox[];
  /** Dimensions of the page containing the citation */
  page_dimensions?: PageDimensions;
}

/**
 * Metadata for an extracted field, including confidence and citation information
 */
export interface ExtractedFieldMetadata {
  /** The reasoning for the confidence score */
  reasoning?: string;
  /** The confidence score for the field, combined with parsing confidence if applicable */
  confidence?: number;
  /** The confidence score for the field based on the extracted text only */
  extraction_confidence?: number;
  /** The confidence score for the field based on the parsing/OCR quality */
  parsing_confidence?: number;
  citation?: FieldCitation[];
}

/**
 * Dictionary mapping field names to their metadata
 * Values can be ExtractedFieldMetadata objects, nested dictionaries, or arrays
 */
export type ExtractedFieldMetadataDict = Record<
  string,
  ExtractedFieldMetadata | Record<string, unknown> | unknown[]
>;

/**
 * Base extracted data interface
 */
export interface ExtractedData<T = unknown> {
  /** The original data that was extracted from the document. For tracking changes. Should not be updated. */
  original_data: T;
  /** The latest state of the data. Will differ if data has been updated. */
  data: T;
  /** The status of the extracted data. Prefer to use the StatusType values, but any string is allowed. */
  status: StatusType | string;
  /** The overall confidence score for the extracted data. */
  overall_confidence?: number;
  /** Page links, and perhaps eventually bounding boxes, for individual fields in the extracted data. */
  field_metadata?: ExtractedFieldMetadataDict;
  /** The ID of the file that was used to extract the data. */
  file_id?: string;
  /** The name of the file that was used to extract the data. */
  file_name?: string;
  /** The hash of the file that was used to extract the data. */
  file_hash?: string;
  /** Additional metadata about the extracted data, such as errors, tokens, etc. */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for agent data operations
 */
export interface AgentDataConfig {
  /** The deployment name for agent data operations */
  deploymentName: string;
  /** The collection name for agent data operations, defaults to "default" */
  collection: string;
}

/**
 * Type alias for agent data items returned from the SDK.
 *
 * The SDK exports `AgentData` as both a class (with methods like update/delete)
 * and an interface (the response shape). TypeScript merges these, so importing
 * `AgentData` directly causes type errors when spreading/assigning objects
 * because the class methods are expected but not present.
 *
 * This type alias extracts just the data properties from the SDK's return type,
 * excluding the class methods.
 */
type DataPropertiesOnly<T> = Pick<
  T,
  { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
>;
export type AgentDataItem = DataPropertiesOnly<
  Awaited<ReturnType<LlamaCloud["beta"]["agentData"]["get"]>>
>;
