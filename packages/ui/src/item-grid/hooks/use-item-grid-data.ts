import { useEffect, useState, useCallback, useRef } from "react";
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

  // Track the last filter to know when we need to refetch the total count
  const lastFilterRef = useRef<string>("");
  const filterFieldsJson = JSON.stringify(filterFields);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterChanged = lastFilterRef.current !== filterFieldsJson;

      // Fetch paginated data
      const searchPromise = client.beta.agentData.search({
        deployment_name: config.deploymentName,
        collection: config.collection,
        filter: filterFields,
        order_by: sortSpec,
        offset: paginationState.page * paginationState.size,
        page_size: paginationState.size,
      });

      // Only fetch total count when filters change (not on every page change)
      const countPromise = filterChanged
        ? client.beta.agentData.aggregate({
            deployment_name: config.deploymentName,
            collection: config.collection,
            filter: filterFields,
            count: true,
            group_by: [],
          })
        : null;

      const [pageResponse, countResponse] = await Promise.all([
        searchPromise,
        countPromise,
      ]);

      setData(pageResponse.items || []);

      // Update total count if we fetched it
      if (countResponse) {
        const items = countResponse.getPaginatedItems();
        setTotalSize(
          items.length > 0 && items[0].count != null ? items[0].count : 0
        );
        lastFilterRef.current = filterFieldsJson;
      }
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
