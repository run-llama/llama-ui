import { useState, useCallback } from "react";
import type { FileUploadProgress } from "./upload-progress";
import {
  addUploadToQueue,
  updateFileProgress,
  completeFileUpload,
  failFileUpload,
  removeFileUpload,
  hasActiveUploads,
} from "./upload-progress-utils";

export interface UseUploadProgressReturn {
  uploadProgressFiles: FileUploadProgress[];
  startUpload: (file: File) => void;
  updateProgress: (file: File, progress: number) => void;
  completeUpload: (file: File) => void;
  failUpload: (file: File, error: string) => void;
  removeUpload: (file: File) => void;
  clearAllUploads: () => void;
  isVisible: boolean;
  hideProgress: () => void;
}

export function useUploadProgress(): UseUploadProgressReturn {
  const [uploadProgressFiles, setUploadProgressFiles] = useState<
    FileUploadProgress[]
  >([]);
  const [isVisible, setIsVisible] = useState(false);

  const startUpload = useCallback((file: File) => {
    setUploadProgressFiles((prev) => addUploadToQueue(prev, file));
    setIsVisible(true);
  }, []);

  const updateProgress = useCallback((file: File, progress: number) => {
    setUploadProgressFiles((prev) => updateFileProgress(prev, file, progress));
  }, []);

  const completeUpload = useCallback((file: File) => {
    setUploadProgressFiles((prev) => {
      const updated = completeFileUpload(prev, file);
      // Check if all files are now complete
      const allComplete = updated.every(
        (f) => f.status === "completed" || f.status === "error",
      );
      if (allComplete) {
        // Auto-hide after 10 seconds when all files are done
        setTimeout(() => {
          setUploadProgressFiles([]);
          setIsVisible(false);
        }, 10000);
      }
      return updated;
    });
  }, []);

  const failUpload = useCallback((file: File, error: string) => {
    setUploadProgressFiles((prev) => failFileUpload(prev, file, error));
  }, []);

  const removeUpload = useCallback((file: File) => {
    setUploadProgressFiles((prev) => removeFileUpload(prev, file));
  }, []);

  const clearAllUploads = useCallback(() => {
    setUploadProgressFiles([]);
    setIsVisible(false);
  }, []);

  const hideProgress = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Auto-hide when no uploads are active
  const hasUploads = hasActiveUploads(uploadProgressFiles);
  if (!hasUploads && isVisible) {
    setIsVisible(false);
  }

  return {
    uploadProgressFiles,
    startUpload,
    updateProgress,
    completeUpload,
    failUpload,
    removeUpload,
    clearAllUploads,
    isVisible: isVisible && hasUploads,
    hideProgress,
  };
}
