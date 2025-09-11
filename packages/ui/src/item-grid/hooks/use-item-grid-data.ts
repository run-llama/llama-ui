import { useEffect, useState, useCallback } from "react";
import type { PaginationState } from "../types";
import type {
  FilterOperation,
  TypedAgentData,
  AgentClient,
} from "llama-cloud-services/beta/agent";
import { useAgentDataClient } from "../../lib/api-provider";

type UseItemGridHandler<T = unknown> = {
  data: TypedAgentData<T>[];
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
  const client = useAgentDataClient() as AgentClient<T>;
  const [data, setData] = useState<TypedAgentData<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.search({
        filter: filterFields,
        orderBy: sortSpec,
        offset: paginationState.page * paginationState.size,
        pageSize: paginationState.size,
        includeTotal: true,
      });

      setData(response.items || []);
      setTotalSize(response.totalSize || 0);
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
  ]);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      try {
        await client.deleteItem(itemId);

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
