import { useCallback, useState } from "react";
import { useIndexStore } from "./use-index-store";
import type { UpsertIndexParams, IndexSummary, AddFilesParams } from "../types";

interface UseIndexUpsertResult {
  upsertIndex: (params: UpsertIndexParams) => Promise<IndexSummary>;
  addFiles: (params: AddFilesParams) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
}

export function useIndexUpsert(): UseIndexUpsertResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upsertStore = useIndexStore((s) => s.upsert);
  const addFilesStore = useIndexStore((s) => s.addFiles);

  const upsertIndex = useCallback(async (params: UpsertIndexParams) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const summary = await upsertStore(params);
      setIsSubmitting(false);
      return summary;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsSubmitting(false);
      throw error;
    }
  }, [upsertStore]);

  const addFiles = useCallback(async (params: AddFilesParams) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await addFilesStore(params);
      setIsSubmitting(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsSubmitting(false);
      throw error;
    }
  }, [addFilesStore]);

  return { upsertIndex, addFiles, isSubmitting, error };
}

