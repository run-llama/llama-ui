import type { ReactNode } from "react";
import type { FileType } from "../utils/file-utils";
import type { LlamaCloudClient } from "../../lib/clients";

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
  /** SHA-256 hash of the file, if hashing was enabled */
  fileHash?: string;
}

export interface UploadResult {
  success: boolean;
  data: FileUploadData | null;
  error: Error | null;
}

export interface UseFileUploadOptions {
  onProgress?: (file: File, progress: number) => void;
  onUploadStart?: (file: File, fileHash?: string) => void;
  onUploadComplete?: (file: File, fileHash?: string) => void;
  onUploadError?: (file: File, error: string, fileHash?: string) => void;
  /**
   * Whether to compute a SHA-256 hash of the file before uploading.
   * The hash will be used as the external_file_id for deduplication.
   * @default false
   */
  hashFile?: boolean;
  /**
   * Prefix to prepend to the file hash when used as an external_file_id.
   * Only applicable when hashFile is true.
   * @default ""
   */
  externalIdPrefix?: string;
  /**
   * LlamaCloud client instance for file uploads.
   * When provided, uses the new @llamaindex/llama-cloud SDK for uploads.
   */
  llamaCloudClient?: LlamaCloudClient;
  /**
   * The intended purpose of the file when using the LlamaCloud SDK.
   * Valid values: 'user_data', 'parse', 'extract', 'split', 'classify', 'sheet', 'agent_app'
   * @default "user_data"
   */
  filePurpose?: string;
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
  /**
   * Computes the SHA-256 hash of a file without uploading it.
   * Useful for checking if a file already exists before uploading.
   */
  computeHash: (file: File) => Promise<string>;
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
  /** Title text shown in the dropzone (default: "Drag files here to upload") */
  uploadTitle?: string;
  /** Description text shown below the title (e.g., "Up to 20 files, 315 MB total") */
  uploadDescription?: string;
  /** Text describing supported file formats */
  supportedFiles?: string;
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
  /**
   * Whether to compute a SHA-256 hash of the file before uploading.
   * The hash will be included in the FileUploadData and used as external_file_id
   * for deduplication.
   * @default false
   */
  hashFile?: boolean;
  /**
   * Prefix to prepend to the file hash when used as an external_file_id.
   * Only applicable when hashFile is true.
   * @default ""
   */
  externalIdPrefix?: string;
  /**
   * LlamaCloud client instance for file uploads.
   * When provided, uses the new @llamaindex/llama-cloud SDK for uploads.
   */
  llamaCloudClient?: LlamaCloudClient;
  /**
   * The intended purpose of the file when using the LlamaCloud SDK.
   * Valid values: 'user_data', 'parse', 'extract', 'split', 'classify', 'sheet', 'agent_app'
   * @default "user_data"
   */
  filePurpose?: string;
}

export type { FileUploadProgress } from "./upload-progress";
