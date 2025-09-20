import { useCallback, useEffect, useMemo, useState } from "react";
import { useIndexStore } from "./use-index-store";
import type { IndexSummary } from "../types";

interface UseIndexResult {
  index: IndexSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useIndex(id: string): UseIndexResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useIndexStore();
  const record = get.indexes;
  const refreshStore = get.refresh;

  const index = useMemo(() => record[id] ?? null, [record, id]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshStore(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh index");
    } finally {
      setLoading(false);
    }
  }, [id, refreshStore]);

  useEffect(() => {
    if (!index) {
      // Attempt to fetch if missing
      void refresh();
    }
  }, [index, refresh]);

  return { index, loading, error, refresh };
}

