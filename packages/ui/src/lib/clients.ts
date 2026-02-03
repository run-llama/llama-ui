import { client as workflowsClient } from "@llamaindex/workflows-client";
import LlamaCloud from "@llamaindex/llama-cloud";
import {
  getCloudClient,
  configureCloudClient,
  type CloudClientConfig,
} from "./cloud-client";

// Export individual creator functions and types with clear names
// Primary (new) names
export {
  createClient as createWorkflowsClient,
  createConfig as createWorkflowsConfig,
  type Client as WorkflowsClient,
} from "@llamaindex/workflows-client";

export { workflowsClient };

export { createAgentDataConfig, type AgentDataConfig } from "./agent-data";

// Export the cloud client getter and configurator
export { getCloudClient, configureCloudClient, type CloudClientConfig };

// Export CloudApiClient type - aliased from the underlying LlamaCloud SDK type
export type CloudApiClient = LlamaCloud;
