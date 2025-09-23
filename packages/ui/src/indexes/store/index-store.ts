import { create } from "zustand";
import type { CloudApiClient } from "../../lib/clients";
import type { Pipeline } from "./helper";
import { fetchPipelines, getPipeline } from "./helper";

export interface IndexStoreState {
  indexes: Record<string, Pipeline>;

  // list + get only
  sync(): Promise<void>;
  refresh(id: string): Promise<void>;
}

export const createIndexStore = (
  _client: CloudApiClient,
  options?: { getProject?: () => { id?: string | null } }
) =>
  create<IndexStoreState>()((set) => ({
    indexes: {},

    sync: async () => {
      try {
        const { id } = options?.getProject?.() ?? {};
        const list = await fetchPipelines({ projectId: id });
        set({
          indexes: Object.fromEntries(list.map((i: Pipeline) => [i.id, i])),
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to sync indexes:", error);
      }
    },

    refresh: async (id: string) => {
      try {
        const { id: projectId } = options?.getProject?.() ?? {};
        const pipeline = await getPipeline(id, { projectId });
        set((state) => ({ indexes: { ...state.indexes, [id]: pipeline } }));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to refresh index:", id, error);
      }
    },
  }));
