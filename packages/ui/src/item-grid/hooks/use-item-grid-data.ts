import { useEffect, useState, useCallback } from "react";
import type { PaginationState } from "../types";
import type {
  FilterOperation,
  TypedAgentData,
  AgentClient,
  ExtractedData,
  TypedAgentDataItems,
} from "llama-cloud-services/beta/agent";
import { mockResponse } from "./mock-response";

type UseItemGridHandler<T = unknown> = {
  data: TypedAgentData<ExtractedData<T>>[];
  loading: boolean;
  error: string | null;
  totalSize: number;
  deleteItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
};
// Custom hook for data fetching
export function useItemGridData<T = unknown>(
  paginationState: PaginationState,
  isMock: boolean,
  filterFields: Record<string, FilterOperation> = {},
  sortSpec: string | undefined = undefined,
  client: AgentClient<ExtractedData<T>>
): UseItemGridHandler<T> {
  const [data, setData] = useState<TypedAgentData<ExtractedData<T>>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response: Awaited<ReturnType<typeof client.search>>;
      if (isMock) {
        response = mockResponse as TypedAgentDataItems<ExtractedData<T>>;
      } else {
        response = await client.search({
          filter: filterFields,
          orderBy: sortSpec,
          offset: paginationState.page * paginationState.size,
          pageSize: paginationState.size,
          includeTotal: true,
        });
      }

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
    isMock,
    JSON.stringify(filterFields),
    sortSpec,
    client,
  ]);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (isMock) {
        // For mock mode, just remove from local state
        setData((prevData) =>
          prevData.filter((item) => String(item.id) !== String(itemId))
        );
        setTotalSize((prevTotal) => prevTotal - 1);
        return { success: true };
      }

      try {
        await client.deleteItem(itemId);

        // Remove item from local state immediately
        setData((prevData) =>
          prevData.filter((item) => String(item.id) !== String(itemId))
        );
        setTotalSize((prevTotal) => prevTotal - 1);
        console.log("Item deleted successfully:", itemId);
        return { success: true };
      } catch (error) {
        console.error("Delete error:", error);
        return {
          success: false,
          error: "Failed to delete item. Please try again.",
        };
      }
    },
    [isMock, client]
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
  };
}
