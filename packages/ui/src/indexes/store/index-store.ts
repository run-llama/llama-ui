import { create } from "zustand";
import type { CloudApiClient } from "../../lib/clients";
import type { IndexSummary, UpsertIndexParams, AddFilesParams } from "../types";
import {
  fetchPipelines,
  upsertPipeline,
  getPipeline,
  addFilesToPipeline,
} from "./helper";

export interface IndexStoreState {
  indexes: Record<string, IndexSummary>;

  // CRUD
  sync(): Promise<void>;
  refresh(id: string): Promise<void>;
  upsert(params: UpsertIndexParams): Promise<IndexSummary>;
  addFiles(params: AddFilesParams): Promise<void>;
}

export const createIndexStore = (_client: CloudApiClient) =>
  create<IndexStoreState>()((set, get) => ({
    indexes: {},

    sync: async () => {
      try {
        const list = await fetchPipelines();
        set({
          indexes: Object.fromEntries(list.map((i) => [i.id, i])),
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to sync indexes:", error);
      }
    },

    refresh: async (id: string) => {
      try {
        const summary = await getPipeline(id);
        set((state) => ({ indexes: { ...state.indexes, [id]: summary } }));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to refresh index:", id, error);
      }
    },

    upsert: async (params: UpsertIndexParams) => {
      const summary = await upsertPipeline(params);
      set((state) => ({ indexes: { ...state.indexes, [summary.id]: summary } }));
      return summary;
    },

    addFiles: async (params: AddFilesParams) => {
      await addFilesToPipeline(params);
      // Optionally refresh status after add
      try {
        const summary = await getPipeline(params.indexId);
        set((state) => ({ indexes: { ...state.indexes, [summary.id]: summary } }));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to refresh after addFiles:", error);
      }
    },
  }));

