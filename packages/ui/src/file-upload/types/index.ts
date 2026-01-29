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

export interface UseFileUploadReturn {
  isUploading: boolean;
  uploadFile: (file: File) => Promise<UploadResult>;
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
  content: File | null;
  onContentChange: (content: File | null) => void;
  allowFileRemoval?: boolean;
  showHeader?: boolean;
  /** Title text shown in the dropzone (default: "Drag files here to upload") */
  uploadTitle?: string;
  /** Description text shown below the title (e.g., "Up to 20 files, 315 MB total") */
  uploadDescription?: string;
  /** Text describing supported file formats */
  supportedFiles?: string;
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
