import { client as workflowsClient } from "@llamaindex/workflows-client";
import LlamaCloud from "@llamaindex/llama-cloud";
import {
  getStainlessClient,
  configureStainlessClient,
} from "./stainless-client";

// Export individual creator functions and types with clear names
// Primary (new) names
export {
  createClient as createWorkflowsClient,
  createConfig as createWorkflowsConfig,
  type Client as WorkflowsClient,
} from "@llamaindex/workflows-client";

export { workflowsClient };

export {
  createAgentDataClient as createCloudAgentClient,
  type AgentClient as CloudAgentClient,
} from "./agent-data";

// Export the Stainless client getter and configurator
export { getStainlessClient, configureStainlessClient };

// Export LlamaCloud type for backward compatibility
export type CloudApiClient = LlamaCloud;
