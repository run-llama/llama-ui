import { useEffect, useState, useCallback } from "react";
import type { PaginationState } from "../types";
import type { FilterOperation, AgentDataItem } from "@/src/lib/agent-data";
import { useAgentDataConfig, useCloudApiClient } from "../../lib/api-provider";

type UseItemGridHandler<T = unknown> = {
  data: AgentDataItem[];
  loading: boolean;
  error: string | null;
  totalSize: number;
  deleteItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  fetchData: () => Promise<void>;
};

// Custom hook for data fetching
export function useItemGridData<T = unknown>(
  paginationState: PaginationState,
  filterFields: Record<string, FilterOperation> = {},
  sortSpec: string | undefined = undefined
): UseItemGridHandler<T> {
  const client = useCloudApiClient();
  const config = useAgentDataConfig();
  const [data, setData] = useState<AgentDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse = await client.beta.agentData.search({
        deployment_name: config.deploymentName,
        collection: config.collection,
        filter: filterFields,
        order_by: sortSpec,
        offset: paginationState.page * paginationState.size,
        page_size: paginationState.size,
        include_total: true,
      });

      setData(pageResponse.items || []);

      // Access total_size from the underlying response body if available
      const body = pageResponse as unknown as {
        total_size?: number | null;
      };
      setTotalSize(body.total_size ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [
    paginationState.page,
    paginationState.size,
    JSON.stringify(filterFields),
    sortSpec,
    client,
    config.deploymentName,
    config.collection,
  ]);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      try {
        await client.beta.agentData.delete(itemId);

        // Remove item from local state immediately
        setData((prevData) =>
          prevData.filter((item) => String(item.id) !== String(itemId))
        );
        setTotalSize((prevTotal) => prevTotal - 1);
        return { success: true };
      } catch (error) {
        // eslint-disable-next-line no-console -- needed
        console.error("Delete error:", error);
        return {
          success: false,
          error: "Failed to delete item. Please try again.",
        };
      }
    },
    [client]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    totalSize,
    deleteItem: handleDeleteItem,
    fetchData,
  };
}
