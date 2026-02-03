import { useEffect, useState, useCallback } from "react";
import type { PaginationState } from "../types";
import type {
  AgentDataItem,
  AgentDataSearchParams,
} from "@/src/lib/agent-data";
import { useAgentDataConfig, useCloudApiClient } from "../../lib/api-provider";

type UseItemGridHandler = {
  data: AgentDataItem[];
  loading: boolean;
  error: string | null;
  totalSize: number;
  deleteItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  fetchData: () => Promise<void>;
};

// Custom hook for data fetching
export function useItemGridData(
  paginationState: PaginationState,
  filterFields: Record<string, AgentDataSearchParams.Filter> = {},
  sortSpec: string | undefined = undefined
): UseItemGridHandler {
  const client = useCloudApiClient();
  const config = useAgentDataConfig();
  const [data, setData] = useState<AgentDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);

  const filterFieldsJson = JSON.stringify(filterFields);

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

      // The SDK's PaginatedCursorPost class stores the raw response in a protected 'body' property.
      // The total_size field is part of the raw API response but not exposed as a typed property
      // on the paginated response class. We need to access it through the body property.
      const response = pageResponse as unknown as {
        body?: { total_size?: number | null };
      };

      setTotalSize(response.body?.total_size ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterFields is serialized to filterFieldsJson for stable comparison
  }, [
    paginationState.page,
    paginationState.size,
    filterFieldsJson,
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
