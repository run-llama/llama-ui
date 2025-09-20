import { useEffect, useMemo, useState } from "react";
import { useIndexStore } from "./use-index-store";
import type { IndexSummary } from "../types";

interface UseIndexListResult {
  indexes: IndexSummary[];
  loading: boolean;
  error: string | null;
  sync: () => Promise<void>;
}

export function useIndexList(): UseIndexListResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const store = useIndexStore();
  const record = store.indexes;
  const syncStore = store.sync;

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError(null);
      try {
        await syncStore();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load indexes");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [syncStore]);

  const indexes = useMemo(() => Object.values(record), [record]);

  return {
    indexes,
    loading,
    error,
    sync: syncStore,
  };
}

