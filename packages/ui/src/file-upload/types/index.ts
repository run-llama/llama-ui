import type { ReactNode } from "react";
import type { FileType } from "../utils/file-utils";

interface BaseFileUploadProps {
  allowedFileTypes?: FileType[];
}

export interface FileDropzoneProps extends BaseFileUploadProps {
  multiple?: boolean;
  selectedFiles?: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile?: (file: File) => void;
  title?: string;
  description?: string;
  supportedFiles?: string;
  showRemoveButton?: boolean;
  disabled?: boolean;
  maxFileSizeBytes?: number;
}

export interface FileUploadData {
  file: File;
  fileId: string;
  url?: string;
}

export interface UploadResult {
  success: boolean;
  data: FileUploadData | null;
  error: Error | null;
}

export interface UseFileUploadOptions {
  onProgress?: (file: File, progress: number) => void;
  onUploadStart?: (file: File) => void;
  onUploadComplete?: (file: File) => void;
  onUploadError?: (file: File, error: string) => void;
}

export interface UploadFromUrlOptions {
  name?: string;
  proxyUrl?: string;
  requestHeaders?: Record<string, string>;
}

export interface UseFileUploadReturn {
  isUploading: boolean;
  uploadFile: (file: File) => Promise<UploadResult>;
  uploadFromUrl: (
    url: string,
    options?: UploadFromUrlOptions
  ) => Promise<UploadResult>;
  uploadAndReturn: (file: File) => Promise<UploadResult>;
}

export interface InputField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
}

export interface FileUploadProps extends BaseFileUploadProps {
  className?: string;
  heading: string;
  content: File | string | null;
  onContentChange: (content: File | string | null) => void;
  allowFileRemoval?: boolean;
  showHeader?: boolean;
  uploadDescription?: string;
  fileUrlPlaceholder?: string;
  disableWhenHasSelection?: boolean;
  footer?: ReactNode;
  onSelectFile?: () => void;
  selectFileLabel?: string;
  selectFileDescription?: string;
  maxFileSizeBytes?: number;
}

export interface FileUploaderProps extends BaseFileUploadProps {
  title?: string;
  description?: string;
  inputFields?: InputField[];
  multiple?: boolean;
  onSuccess: (
    data: FileUploadData[],
    fieldValues: Record<string, string>
  ) => Promise<void>;
  trigger?: ReactNode;
  isProcessing?: boolean;
  disabled?: boolean;
  onSelectFile?: () => void;
  selectFileLabel?: string;
  selectFileDescription?: string;
  maxFileSizeBytes?: number;
}

export type { FileUploadProgress } from "./upload-progress";
