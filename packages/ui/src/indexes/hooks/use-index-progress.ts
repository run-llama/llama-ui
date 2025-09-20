import { useMemo, useEffect } from "react";
import { useIndexStore } from "./use-index-store";
import type { IndexProgressState, RunStatus } from "../types";

export function useIndexProgress(id: string): IndexProgressState {
  const store = useIndexStore();
  const { indexes, refresh } = store;

  useEffect(() => {
    async function syncOnce() {
      try {
        await refresh(id);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to refresh index for progress:", error);
      }
    }
    syncOnce();
  }, [id, refresh]);

  return useMemo(() => {
    const summary = indexes[id];
    if (!summary) {
      return { status: "idle" as RunStatus };
    }

    return { status: summary.status };
  }, [indexes, id]);
}

