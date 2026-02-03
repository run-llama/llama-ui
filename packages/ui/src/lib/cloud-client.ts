import LlamaCloud from "@llamaindex/llama-cloud";

export interface CloudClientConfig {
  apiKey?: string;
  baseURL?: string;
  /** Project ID to include as Project-Id header in all requests */
  projectId?: string;
  /** Additional headers to include in all requests */
  headers?: Record<string, string>;
}

let clientInstance: LlamaCloud | null = null;
let currentConfig: CloudClientConfig = {};

/**
 * Build the default headers object from config options.
 */
function buildDefaultHeaders(
  config: CloudClientConfig
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.projectId) {
    headers["Project-Id"] = config.projectId;
  }

  if (config.headers) {
    Object.assign(headers, config.headers);
  }

  return headers;
}

/**
 * Get the configured cloud client instance.
 * Will create a new instance with the current config if not yet configured.
 * Note: This may throw if no API key is configured and LLAMA_CLOUD_API_KEY env var is not set.
 */
export function getCloudClient(): LlamaCloud {
  if (!clientInstance) {
    const defaultHeaders = buildDefaultHeaders(currentConfig);
    clientInstance = new LlamaCloud({
      apiKey: currentConfig.apiKey,
      baseURL: currentConfig.baseURL,
      ...(Object.keys(defaultHeaders).length > 0 && { defaultHeaders }),
    });
  }
  return clientInstance;
}

/**
 * Configure the cloud client with API key, base URL, project ID, and/or custom headers.
 * This will replace any existing client instance.
 *
 * @param options.apiKey - API key for authentication
 * @param options.baseURL - Base URL for the API
 * @param options.projectId - Project ID to include as Project-Id header
 * @param options.headers - Additional headers to include in all requests
 */
export function configureCloudClient(options: CloudClientConfig): void {
  currentConfig = { ...options };
  const defaultHeaders = buildDefaultHeaders(options);
  clientInstance = new LlamaCloud({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    ...(Object.keys(defaultHeaders).length > 0 && { defaultHeaders }),
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
