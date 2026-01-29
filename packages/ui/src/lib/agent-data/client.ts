import LlamaCloud, { NotFoundError } from "@llamaindex/llama-cloud";
import type { Beta } from "@llamaindex/llama-cloud/resources";
import { getStainlessClient } from "../stainless-client";
import type {
  AggregateAgentDataOptions,
  DeleteAgentDataOptions,
  SearchAgentDataOptions,
  TypedAgentData,
  TypedAgentDataItems,
  TypedAggregateGroup,
  TypedAggregateGroupItems,
} from "./types";

/** Type representing the Stainless API response for agent data */
type ApiAgentData = Beta.AgentData;
type ApiAggregateResponse = Beta.AgentDataAggregateResponse;

/**
 * Async client for agent data operations
 */
export class AgentClient<T = unknown> {
  private client: LlamaCloud;
  private collection: string;
  private deploymentName: string;

  constructor({
    client,
    collection = "default",
    deploymentName = "_public",
    agentUrlId,
  }: {
    client?: LlamaCloud;
    collection?: string;
    deploymentName?: string;
    /** @deprecated use deploymentName instead */
    agentUrlId?: string;
  }) {
    this.client = client ?? getStainlessClient();
    this.collection = collection;
    this.deploymentName = agentUrlId || deploymentName;
  }

  /**
   * Create new agent data
   */
  async createItem(data: T): Promise<TypedAgentData<T>> {
    const response = await this.client.beta.agentData.agentData({
      deployment_name: this.deploymentName,
      collection: this.collection,
      data: data as Record<string, unknown>,
    });

    return this.transformResponse(response);
  }

  /**
   * Get agent data by ID
   */
  async getItem(id: string): Promise<TypedAgentData<T> | null> {
    try {
      const response = await this.client.beta.agentData.get(id);
      return this.transformResponse(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update agent data
   */
  async updateItem(id: string, data: T): Promise<TypedAgentData<T>> {
    const response = await this.client.beta.agentData.update(id, {
      data: data as Record<string, unknown>,
    });

    return this.transformResponse(response);
  }

  /**
   * Delete agent data
   */
  async deleteItem(id: string): Promise<void> {
    await this.client.beta.agentData.delete(id);
  }

  /**
   * Delete all matching agent data, returns the total number of deleted items
   */
  async delete(options: DeleteAgentDataOptions): Promise<number> {
    const response = await this.client.beta.agentData.deleteByQuery({
      deployment_name: this.deploymentName,
      ...(this.collection !== undefined && {
        collection: this.collection,
      }),
      ...(options.filter !== undefined && { filter: options.filter }),
    });
    return response.deleted_count;
  }

  /**
   * Search agent data
   */
  async search(
    options: SearchAgentDataOptions
  ): Promise<TypedAgentDataItems<T>> {
    const pageResponse = await this.client.beta.agentData.search({
      deployment_name: this.deploymentName,
      ...(this.collection !== undefined && {
        collection: this.collection,
      }),
      ...(options.filter !== undefined && { filter: options.filter }),
      ...(options.orderBy !== undefined && { order_by: options.orderBy }),
      ...(options.pageSize !== undefined && { page_size: options.pageSize }),
      ...(options.offset !== undefined && { offset: options.offset }),
      ...(options.includeTotal !== undefined && {
        include_total: options.includeTotal,
      }),
    });

    const result: TypedAgentDataItems<T> = {
      items: pageResponse.items.map((item: ApiAgentData) =>
        this.transformResponse(item)
      ),
    };

    // Access total_size from the underlying response body if available
    const body = pageResponse as unknown as {
      total_size?: number | null;
      next_page_token?: string | null;
    };
    if (body.total_size !== null && body.total_size !== undefined) {
      result.totalSize = body.total_size;
    }

    if (
      pageResponse.next_page_token !== null &&
      pageResponse.next_page_token !== undefined &&
      pageResponse.next_page_token !== ""
    ) {
      result.nextPageToken = pageResponse.next_page_token;
    }

    return result;
  }

  /**
   * Aggregate agent data into groups
   */
  async aggregate(
    options: AggregateAgentDataOptions
  ): Promise<TypedAggregateGroupItems<T>> {
    const pageResponse = await this.client.beta.agentData.aggregate({
      deployment_name: this.deploymentName,
      ...(this.collection !== undefined && {
        collection: this.collection,
      }),
      ...(options.filter !== undefined && { filter: options.filter }),
      ...(options.groupBy !== undefined && { group_by: options.groupBy }),
      ...(options.count !== undefined && { count: options.count }),
      ...(options.first !== undefined && { first: options.first }),
      ...(options.orderBy !== undefined && { order_by: options.orderBy }),
      ...(options.offset !== undefined && { offset: options.offset }),
      ...(options.pageSize !== undefined && { page_size: options.pageSize }),
    });

    const result: TypedAggregateGroupItems<T> = {
      items: pageResponse.items.map((item: ApiAggregateResponse) =>
        this.transformAggregateResponse(item)
      ),
    };

    // Access total_size from the underlying response body if available
    const body = pageResponse as unknown as {
      total_size?: number | null;
      next_page_token?: string | null;
    };
    if (body.total_size !== null && body.total_size !== undefined) {
      result.totalSize = body.total_size;
    }

    if (
      pageResponse.next_page_token !== null &&
      pageResponse.next_page_token !== undefined &&
      pageResponse.next_page_token !== ""
    ) {
      result.nextPageToken = pageResponse.next_page_token;
    }

    return result;
  }

  /**
   * Transform API response to typed data
   */
  private transformResponse(data: ApiAgentData): TypedAgentData<T> {
    const result: TypedAgentData<T> = {
      id: data.id!,
      deploymentName: data.deployment_name,
      data: data.data as T,
      createdAt: new Date(data.created_at!),
      updatedAt: new Date(data.updated_at!),
    };

    if (data.collection !== undefined) {
      result.collection = data.collection;
    }

    return result;
  }

  /**
   * Transform API aggregate response to typed data
   */
  private transformAggregateResponse(
    data: ApiAggregateResponse
  ): TypedAggregateGroup<T> {
    const result: TypedAggregateGroup<T> = {
      groupKey: data.group_key,
    };

    if (data.count !== null && data.count !== undefined) {
      result.count = data.count;
    }

    if (data.first_item !== null && data.first_item !== undefined) {
      result.firstItem = data.first_item as T;
    }

    return result;
  }
}

export interface AgentDataClientOptions {
  /** API key for the client */
  apiKey?: string;
  /** Base URL of the llama cloud api */
  baseUrl?: string;
  /** If running in an agent runtime, optionally provide the window url to infer the deployment name */
  windowUrl?: string;
  /** Deployment name for the client, if not provided, it will be inferred from the window url, or fall back to "default" */
  deploymentName?: string;
  /** Collection name for the client, defaults to "default" */
  collection?: string;
}

/**
 * Create a new AgentClient instance. Does its best to infer deployment name from environment.
 * Pass in the window url and/or env to infer the deployment name from them.
 * @param options - The options for the client
 * @returns A new AgentClient instance
 */
export function createAgentDataClient<T = unknown>({
  client,
  windowUrl,
  env,
  deploymentName,
  agentUrlId,
  collection = "default",
}: {
  client?: LlamaCloud;
  windowUrl?: string;
  env?: Record<string, string>;
  deploymentName?: string;
  /** @deprecated use deploymentName instead */
  agentUrlId?: string;
  collection?: string;
} = {}): AgentClient<T> {
  if (env && !deploymentName) {
    deploymentName =
      env.LLAMA_DEPLOY_DEPLOYMENT_NAME ||
      env.NEXT_PUBLIC_LLAMA_DEPLOY_DEPLOYMENT_NAME ||
      env.VITE_LLAMA_DEPLOY_DEPLOYMENT_NAME;
  }
  if (windowUrl && !deploymentName) {
    try {
      const url = new URL(windowUrl);
      const path = url.pathname;
      const isLocalhost =
        url.hostname.includes("localhost") ||
        url.hostname.includes("127.0.0.1");
      if (path.startsWith("/deployments/") && !isLocalhost) {
        // /deployments/<agent-url-id>/ui/ -> ["", "deployments", "<agent-url-id>", "ui"]
        deploymentName = path.split("/")[2];
      }
    } catch (error) {
      console.warn(
        "Failed to infer deployment name from window url, falling back to default",
        error
      );
    }
  }

  return new AgentClient({
    ...(deploymentName && { deploymentName }),
    ...(agentUrlId && { agentUrlId }),
    collection,
    client: client ?? getStainlessClient(),
  });
}
