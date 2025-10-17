/**
 * Multi-Service API Provider
 * Manages pre-created API clients for different services
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  CloudAgentClient,
  cloudApiClient,
  CloudApiClient,
  WorkflowsClient,
  workflowsClient,
  createCloudAgentClient,
  createWorkflowsClient,
} from "./clients";

export interface ApiClients {
  workflowsClient?: WorkflowsClient;
  cloudApiClient?: CloudApiClient;
  agentDataClient?: CloudAgentClient;
}

export interface ApiProviderProps {
  children: ReactNode;
  clients: ApiClients;
  project?: {
    id?: string | null;
  };
}

interface ApiContextValue {
  clients: ApiClients;
  project?: {
    id?: string | null;
  };
}

// ===== Context =====

const ApiContext = createContext<ApiContextValue | null>(null);

// ===== Provider =====

export function ApiProvider({ children, clients, project }: ApiProviderProps) {
  const contextValue = useMemo(
    () => ({
      clients,
      project,
    }),
    [clients, project]
  );

  return (
    <ApiContext.Provider value={contextValue}>{children}</ApiContext.Provider>
  );
}

// ===== Mock Clients Factory for Testing/Storybook =====

export function createMockClients(): ApiClients {
  return {
    workflowsClient: workflowsClient,
    cloudApiClient: cloudApiClient,
    agentDataClient: createCloudAgentClient({
      agentUrlId: "your-agent-url-id",
      collection: "your-collection",
    }),
  };
}

// ===== Real Clients Factory (env-based) =====

/**
 * Create real clients using API key from env and agent options from params.
 * - API key expected in one of: LLAMA_CLOUD_API_KEY or VITE_LLAMA_CLOUD_API_KEY
 * - Agent client options are required via function params
 */
export function createRealClientsForTests(params: {
  apiKey?: string;
  baseUrl?: string;
  agent?: {
    agentUrlId: string;
    collection: string;
  };
}): ApiClients {
  const apiKey = params.apiKey;

  // Note: current SDK clients read API key from env/runtime; callers should ensure
  // the key is available to the SDK (e.g., via env or client config). For now we
  // return bound instances and rely on SDK's internal auth handling.
  if (!apiKey) {
    throw new Error("API key is required");
  }
  workflowsClient.setConfig({
    baseUrl: params.baseUrl,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  cloudApiClient.setConfig({
    baseUrl: params.baseUrl,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  return {
    workflowsClient,
    cloudApiClient,
    agentDataClient: createCloudAgentClient({
      client: cloudApiClient,
      agentUrlId: params.agent?.agentUrlId,
      windowUrl:
        typeof window !== "undefined" ? window.location.href : undefined,
      collection: params.agent?.collection,
    }),
  };
}

export function createLocalWorkflowsClientForTests(): ApiClients {
  return {
    workflowsClient: createWorkflowsClient({
      baseUrl: "http://localhost:8000",
    }),
  };
}

// ===== Hooks =====

function useApiContext(): ApiContextValue {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error(
      "useApiContext must be used within an ApiProvider. " +
        "Please wrap your component tree with <ApiProvider>."
    );
  }

  return context;
}

export function useWorkflowsClient(): WorkflowsClient {
  const { clients } = useApiContext();

  if (!clients.workflowsClient) {
    throw new Error(
      "No workflows client configured. " +
        "Please ensure workflowsClient is configured in ApiProvider."
    );
  }

  return clients.workflowsClient;
}

export function useCloudApiClient(): CloudApiClient {
  const { clients } = useApiContext();

  if (!clients.cloudApiClient) {
    throw new Error(
      "No cloud api client configured. " +
        "Please ensure cloudApiClient is configured in ApiProvider."
    );
  }

  return clients.cloudApiClient;
}

export function useAgentDataClient(): CloudAgentClient {
  const { clients } = useApiContext();

  if (!clients.agentDataClient) {
    throw new Error(
      "No agent data client configured. " +
        "Please ensure agentDataClient is configured in ApiProvider."
    );
  }

  return clients.agentDataClient;
}

export function useApiClients(): ApiClients {
  const { clients } = useApiContext();
  return clients;
}

export function useProject(): {
  id?: string | null;
} {
  const { project } = useApiContext();
  return project ?? {};
}
