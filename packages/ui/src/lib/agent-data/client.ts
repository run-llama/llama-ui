import type { AgentDataConfig } from "./types";

/**
 * Options for creating agent data config
 */
export interface CreateAgentDataConfigOptions {
  /** If running in an agent runtime, optionally provide the window url to infer the deployment name */
  windowUrl?: string;
  /** Environment variables to check for deployment name */
  env?: Record<string, string>;
  /** Deployment name for the client, if not provided, it will be inferred from the window url or env */
  deploymentName?: string;
  /** @deprecated use deploymentName instead */
  agentUrlId?: string;
  /** Collection name for the client, defaults to "default" */
  collection?: string;
}

/**
 * Create agent data configuration. Does its best to infer deployment name from environment.
 * Pass in the window url and/or env to infer the deployment name from them.
 * @param options - The options for the config
 * @returns Agent data configuration
 */
export function createAgentDataConfig({
  windowUrl,
  env,
  deploymentName,
  agentUrlId,
  collection = "default",
}: CreateAgentDataConfigOptions = {}): AgentDataConfig {
  // Support deprecated agentUrlId
  let resolvedDeploymentName = agentUrlId || deploymentName;

  if (env && !resolvedDeploymentName) {
    resolvedDeploymentName =
      env.LLAMA_DEPLOY_DEPLOYMENT_NAME ||
      env.NEXT_PUBLIC_LLAMA_DEPLOY_DEPLOYMENT_NAME ||
      env.VITE_LLAMA_DEPLOY_DEPLOYMENT_NAME;
  }

  if (windowUrl && !resolvedDeploymentName) {
    try {
      const url = new URL(windowUrl);
      const path = url.pathname;
      const isLocalhost =
        url.hostname.includes("localhost") ||
        url.hostname.includes("127.0.0.1");
      if (path.startsWith("/deployments/") && !isLocalhost) {
        // /deployments/<agent-url-id>/ui/ -> ["", "deployments", "<agent-url-id>", "ui"]
        resolvedDeploymentName = path.split("/")[2];
      }
    } catch (error) {
      // eslint-disable-next-line no-console -- Warn about URL parsing failure during config setup
      console.warn(
        "Failed to infer deployment name from window url, falling back to default",
        error
      );
    }
  }

  if (!resolvedDeploymentName) {
    resolvedDeploymentName = "_public";
  }

  return {
    deploymentName: resolvedDeploymentName,
    collection,
  };
}
