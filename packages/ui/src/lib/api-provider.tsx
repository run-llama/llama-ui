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
} from "./clients";

export interface ApiClients {
  workflowsClient?: WorkflowsClient;
  cloudApiClient?: CloudApiClient;
  agentDataClient?: CloudAgentClient;
}

export interface ApiProviderProps {
  children: ReactNode;
  clients: ApiClients;
}

interface ApiContextValue {
  clients: ApiClients;
}

// ===== Context =====

const ApiContext = createContext<ApiContextValue | null>(null);

// ===== Provider =====

export function ApiProvider({ children, clients }: ApiProviderProps) {
  const contextValue = useMemo(
    () => ({
      clients,
    }),
    [clients]
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
      baseUrl: "https://api.llamaindex.cloud",
      apiKey: "your-api-key",
      agentUrlId: "your-agent-url-id",
      collection: "your-collection",
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
