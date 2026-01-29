import LlamaCloud from "@llamaindex/llama-cloud";

let clientInstance: LlamaCloud | null = null;
let currentConfig: { apiKey?: string; baseURL?: string } = {};

/**
 * Get the configured cloud client instance.
 * Will create a new instance with the current config if not yet configured.
 * Note: This may throw if no API key is configured and LLAMA_CLOUD_API_KEY env var is not set.
 */
export function getCloudClient(): LlamaCloud {
  if (!clientInstance) {
    clientInstance = new LlamaCloud({
      apiKey: currentConfig.apiKey,
      baseURL: currentConfig.baseURL,
    });
  }
  return clientInstance;
}

/**
 * Configure the cloud client with API key and/or base URL.
 * This will replace any existing client instance.
 */
export function configureCloudClient(options: {
  apiKey?: string;
  baseURL?: string;
}): void {
  currentConfig = { ...options };
  clientInstance = new LlamaCloud({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });
}

/**
 * Reset the client instance (useful for testing).
 */
export function resetCloudClient(): void {
  clientInstance = null;
  currentConfig = {};
}

/**
 * Check if a client has been configured.
 */
export function isClientConfigured(): boolean {
  return clientInstance !== null || !!currentConfig.apiKey;
}

export { LlamaCloud };
