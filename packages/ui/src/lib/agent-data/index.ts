export { AgentClient, createAgentDataClient } from "./client";
export type { AgentDataClientOptions } from "./client";

export type {
  AggregateAgentDataOptions,
  DeleteAgentDataOptions,
  ExtractedData,
  ExtractedFieldMetadata,
  ExtractedFieldMetadataDict,
  FieldCitation,
  FilterOperation,
  PageDimensions,
  SearchAgentDataOptions,
  TypedAgentData,
  TypedAgentDataItems,
  TypedAggregateGroup,
  TypedAggregateGroupItems,
} from "./types";

// Note: BoundingBox is intentionally not re-exported to avoid conflict with file-preview/types.ts
// It is still available as part of the FieldCitation type

// Export the const objects (their types are automatically exported with the same name)
export { StatusType, ComparisonOperator } from "./types";

// Legacy alias for backwards compatibility
export { StatusType as StatusTypeEnum } from "./types";
