import { useMemo } from "react";
import { useCloudApiClient } from "../../lib/api-provider";
import { createIndexStore, type IndexStoreState } from "../store/index-store";

let globalStore: ReturnType<typeof createIndexStore> | null = null;

export function useIndexStore(): IndexStoreState;
export function useIndexStore<T>(selector: (state: IndexStoreState) => T): T;

export function useIndexStore<T>(selector?: (state: IndexStoreState) => T) {
  const client = useCloudApiClient();
  const store = useMemo(() => {
    if (!globalStore) {
      globalStore = createIndexStore(client);
    }
    return globalStore;
  }, [client]);

  return selector ? store(selector) : store();
}

export function __resetIndexStore() {
  globalStore = null;
}

