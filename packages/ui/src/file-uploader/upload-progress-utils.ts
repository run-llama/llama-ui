import type { FileUploadProgress } from "./upload-progress";

/**
 * Utility functions for managing upload progress state
 * These pure functions are easier to test and reason about
 */

/**
 * Threshold for showing overall progress UI and enabling compact mode
 */
export const PROGRESS_THRESHOLD = 3;

/**
 * Determine display modes based on number of files and threshold
 */
export function getDisplayModes(fileCount: number) {
  return {
    showOverallProgress: fileCount > PROGRESS_THRESHOLD,
    isCompact: fileCount > PROGRESS_THRESHOLD,
  };
}

/**
 * Add or replace a file upload in the progress list
 */
export function addUploadToQueue(
  uploads: FileUploadProgress[],
  file: File
): FileUploadProgress[] {
  const newUpload: FileUploadProgress = {
    file,
    progress: 0,
    status: "uploading",
  };

  // Remove existing upload for the same file if any
  const filtered = uploads.filter((upload) => upload.file.name !== file.name);
  return [...filtered, newUpload];
}

/**
 * Update progress for a specific file
 */
export function updateFileProgress(
  uploads: FileUploadProgress[],
  file: File,
  progress: number
): FileUploadProgress[] {
  return uploads.map((upload) =>
    upload.file.name === file.name
      ? { ...upload, progress: Math.min(progress, 100) }
      : upload
  );
}

/**
 * Mark a file as completed
 */
export function completeFileUpload(
  uploads: FileUploadProgress[],
  file: File
): FileUploadProgress[] {
  return uploads.map((upload) =>
    upload.file.name === file.name
      ? { ...upload, progress: 100, status: "completed" as const }
      : upload
  );
}

/**
 * Mark a file as failed with error message
 */
export function failFileUpload(
  uploads: FileUploadProgress[],
  file: File,
  error: string
): FileUploadProgress[] {
  return uploads.map((upload) =>
    upload.file.name === file.name
      ? { ...upload, status: "error" as const, error }
      : upload
  );
}

/**
 * Cancel a specific file upload
 */
export function cancelFileUpload(
  uploads: FileUploadProgress[],
  file: File
): FileUploadProgress[] {
  return uploads.map((upload) =>
    upload.file.name === file.name && upload.status === "uploading"
      ? { ...upload, status: "canceled" as const }
      : upload
  );
}

/**
 * Cancel all uploading files
 */
export function cancelAllUploads(
  uploads: FileUploadProgress[]
): FileUploadProgress[] {
  return uploads.map((upload) =>
    upload.status === "uploading"
      ? { ...upload, status: "canceled" as const }
      : upload
  );
}

/**
 * Remove a specific file from the upload list
 */
export function removeFileUpload(
  uploads: FileUploadProgress[],
  file: File
): FileUploadProgress[] {
  return uploads.filter((upload) => upload.file.name !== file.name);
}

/**
 * Remove completed uploads from the list
 */
export function removeCompletedUploads(
  uploads: FileUploadProgress[]
): FileUploadProgress[] {
  return uploads.filter((upload) => upload.status !== "completed");
}

/**
 * Calculate upload statistics
 */
export interface UploadStats {
  total: number;
  uploading: number;
  completed: number;
  failed: number;
  canceled: number;
  totalProgress: number;
}

export function calculateUploadStats(
  uploads: FileUploadProgress[]
): UploadStats {
  return {
    total: uploads.length,
    uploading: uploads.filter((f) => f.status === "uploading").length,
    completed: uploads.filter((f) => f.status === "completed").length,
    failed: uploads.filter((f) => f.status === "error").length,
    canceled: uploads.filter((f) => f.status === "canceled").length,
    totalProgress:
      uploads.length > 0
        ? Math.round(
            uploads.reduce((sum, f) => sum + f.progress, 0) / uploads.length
          )
        : 0,
  };
}

/**
 * Check if there are any active uploads that require showing the progress UI
 */
export function hasActiveUploads(uploads: FileUploadProgress[]): boolean {
  return uploads.length > 0;
}

/**
 * Determine which files to show based on collapsed state and limit
 */
export function getVisibleFiles(
  uploads: FileUploadProgress[],
  showAll: boolean,
  maxVisible: number = 5
): { filesToShow: FileUploadProgress[]; shouldShowViewMore: boolean } {
  const shouldShowViewMore = uploads.length > maxVisible;
  const filesToShow = showAll ? uploads : uploads.slice(0, maxVisible);

  return { filesToShow, shouldShowViewMore };
}
