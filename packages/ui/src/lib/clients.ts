import { client as cloudApiClient } from "llama-cloud-services/api";
import { client as workflowsClient } from "@llamaindex/workflows-client";

// Export individual creator functions and types with clear names
// Primary (new) names
export {
  createClient as createWorkflowsClient,
  createConfig as createWorkflowsConfig,
} from "@llamaindex/workflows-client";

// Backward-compatible aliases expected by existing stories/exports
export {
  createClient as createWorkflowClient,
  createConfig as createLlamaDeployConfig,
  type Client as LlamaDeployClient,
} from "@llamaindex/workflows-client";
export { workflowsClient };
export type WorkflowsClient = typeof workflowsClient;

export {
  createAgentDataClient as createCloudAgentClient,
  type AgentClient as CloudAgentClient,
} from "llama-cloud-services/beta/agent";

export { cloudApiClient };
export type CloudApiClient = typeof cloudApiClient;
