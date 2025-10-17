export interface FileUploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error" | "canceled";
  error?: string;
}
