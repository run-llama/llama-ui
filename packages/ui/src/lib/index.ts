/**
 * Lib exports
 */

export {
  ApiProvider,
  useWorkflowsClient,
  useCloudApiClient,
  useAgentDataClient,
  useApiClients,
  createMockClients,
  type ApiClients,
  type ApiProviderProps,
} from "./api-provider";

export {
  type StreamOperation,
  type StreamSubscriber,
  type StreamExecutor,
  type SharedStreamingManager,
} from "./shared-streaming";

export {
  createCloudAgentClient,
  workflowsClient,
  getStainlessClient,
  configureStainlessClient,
  createWorkflowsClient,
  createWorkflowsConfig,
  type WorkflowsClient,
  type CloudAgentClient,
  type CloudApiClient,
} from "./clients";

export type {
  JSONValue,
  PrimitiveValue,
  JsonValue,
  JsonObject,
  JsonShape,
} from "./json-types";

export { arrayToCsv } from "./csv-utils";

export { useStreamEventBatcher } from "./use-stream-event-batcher";

// Re-export agent data types for external consumers
export * from "./agent-data";
