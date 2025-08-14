import { client as cloudApiClient } from "llama-cloud-services/api";

// Export individual creator functions and types with clear names
export {
  createClient as createLlamaDeployClient,
  createConfig as createLlamaDeployConfig,
  type Client as LlamaDeployClient,
} from "@llamaindex/llama-deploy";

export {
  createAgentDataClient as createCloudAgentClient,
  type AgentClient as CloudAgentClient,
} from "llama-cloud-services/beta/agent";

export { cloudApiClient };
export type CloudApiClient = typeof cloudApiClient;
