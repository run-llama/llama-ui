import type { FileUploadProgress } from "../types";

export const PROGRESS_THRESHOLD = 3;

export function getDisplayModes(fileCount: number) {
  return {
    showOverallProgress: fileCount > PROGRESS_THRESHOLD,
    isCompact: fileCount > PROGRESS_THRESHOLD,
  };
}

export function addUploadToQueue(
  uploads: FileUploadProgress[],
  file: File
): FileUploadProgress[] {
  const newUpload: FileUploadProgress = {
    file,
    progress: 0,
    status: "uploading",
  };

  const filtered = uploads.filter((upload) => upload.file.name !== file.name);
  return [...filtered, newUpload];
}

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

export function cancelAllUploads(
  uploads: FileUploadProgress[]
): FileUploadProgress[] {
  return uploads.map((upload) =>
    upload.status === "uploading"
      ? { ...upload, status: "canceled" as const }
      : upload
  );
}

export function removeFileUpload(
  uploads: FileUploadProgress[],
  file: File
): FileUploadProgress[] {
  return uploads.filter((upload) => upload.file.name !== file.name);
}

export function removeCompletedUploads(
  uploads: FileUploadProgress[]
): FileUploadProgress[] {
  return uploads.filter((upload) => upload.status !== "completed");
}

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

export function hasActiveUploads(uploads: FileUploadProgress[]): boolean {
  return uploads.length > 0;
}

export function getVisibleFiles(
  uploads: FileUploadProgress[],
  showAll: boolean,
  maxVisible: number = 5
): { filesToShow: FileUploadProgress[]; shouldShowViewMore: boolean } {
  const shouldShowViewMore = uploads.length > maxVisible;
  const filesToShow = showAll ? uploads : uploads.slice(0, maxVisible);

  return { filesToShow, shouldShowViewMore };
}
