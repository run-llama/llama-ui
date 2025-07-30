/**
 * Multi-Service API Provider
 * Manages pre-created API clients for different services
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { type Client, createClient, createConfig } from '@llamaindex/llama-deploy';
import { client as cloudClient } from '@llamaindex/cloud/api';
import { type AgentClient, createAgentDataClient } from '@llamaindex/cloud/beta/agent';

// ===== Types =====
export type CloudApiClient = typeof cloudClient;
export interface ApiClients {
  llamaDeployClient?: Client;
  cloudApiClient?: CloudApiClient;
  agentDataClient?: AgentClient<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  const contextValue = useMemo(() => ({
    clients,
  }), [clients]);

  return (
    <ApiContext.Provider value={contextValue}>
      {children}
    </ApiContext.Provider>
  );
}

// ===== Mock Clients Factory for Testing/Storybook =====

export function createMockClients(): ApiClients {
  return {
    llamaDeployClient: createClient(createConfig()),
    cloudApiClient: cloudClient,
    agentDataClient: createAgentDataClient(createConfig()),
  };
}

// ===== Hooks =====

function useApiContext(): ApiContextValue {
  const context = useContext(ApiContext);
  
  if (!context) {
    throw new Error(
      'useApiContext must be used within an ApiProvider. ' +
      'Please wrap your component tree with <ApiProvider>.'
    );
  }
  
  return context;
}

export function useLlamaDeployClient(): Client {
  const { clients } = useApiContext();
  
  if (!clients.llamaDeployClient) {
    throw new Error(
      'No llama-deploy client configured. ' +
      'Please ensure llamaDeployClient is configured in ApiProvider.'
    );
  }
  
  return clients.llamaDeployClient;
}

export function useCloudApiClient(): CloudApiClient {
  const { clients } = useApiContext();
  
  if (!clients.cloudApiClient) {
    throw new Error(
      'No cloud api client configured. ' +
      'Please ensure cloudApiClient is configured in ApiProvider.'
    );
  }
  
  return clients.cloudApiClient;
}

export function useAgentDataClient(): AgentClient<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { clients } = useApiContext();
  
  if (!clients.agentDataClient) {
    throw new Error(
      'No agent data client configured. ' +
      'Please ensure agentDataClient is configured in ApiProvider.'
    );
  }
  
  return clients.agentDataClient;
}

export function useApiClients(): ApiClients {
  const { clients } = useApiContext();
  return clients;
} 