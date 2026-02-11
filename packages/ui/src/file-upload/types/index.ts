import type { ReactNode } from "react";
import type { FileCreateParams } from "@llamaindex/llama-cloud/resources";
import type { FileType } from "../utils/file-utils";

/**
 * The intended purpose of the file, derived from the SDK's FileCreateParams.
 */
export type FilePurpose = FileCreateParams["purpose"];

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
  /**
   * SHA-256 hash of the file contents, hex-encoded.
   * Present when contentHash option is enabled during upload.
   * Can be used to identify duplicate files by content.
   */
  contentHash?: string;
}

export interface UploadResult {
  success: boolean;
  data: FileUploadData | null;
  error: Error | null;
}

/**
 * Options for content-based file identification.
 *
 * When enabled, computes a SHA-256 hash of the file contents before upload.
 * This hash uniquely identifies the file by its content (not its name),
 * enabling deduplication - files with identical content will have the same hash.
 *
 * The hash is sent as the `external_id` when creating the file in the API,
 * allowing the backend to detect and handle duplicate uploads.
 */
export interface ContentHashOptions {
  /** Enable content hashing for file identification */
  enabled: boolean;
  /**
   * Prefix to prepend to the hash when setting external_id.
   * Useful for namespacing (e.g., "doc_", "img_") to distinguish
   * file types or sources in the backend.
   */
  externalIdPrefix?: string;
}

export interface UseFileUploadOptions {
  onProgress?: (file: File, progress: number) => void;
  onUploadStart?: (file: File) => void;
  onUploadComplete?: (file: File, contentHash?: string) => void;
  onUploadError?: (file: File, error: string) => void;
  /**
   * Enable content-based file identification.
   * When enabled, computes a SHA-256 hash of file contents and uses it
   * as the external_id for deduplication.
   */
  contentHash?: ContentHashOptions;
  /**
   * The intended purpose of the file.
   * Determines how the file will be processed by the backend.
   * @default "user_data"
   */
  purpose?: FilePurpose;

  /**
   * Whether to use the LlamaCloud client to upload files to S3 Storage or not
   * @default true
   */
  useLlamaCloud?: boolean;
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
  /**
   * Enable content-based file identification.
   * When enabled, computes a SHA-256 hash of file contents and uses it
   * as the external_id for deduplication.
   */
  contentHash?: ContentHashOptions;
  /**
   * The intended purpose of the file.
   * Determines how the file will be processed by the backend.
   * @default "user_data"
   */
  purpose?: FilePurpose;

  /**
   * Whether to use the LlamaCloud client to upload files to S3 Storage or not
   * @default true
   */
  useLlamaCloud?: boolean;
}

export type { FileUploadProgress } from "./upload-progress";
