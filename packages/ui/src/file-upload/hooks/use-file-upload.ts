import { useState } from "react";
import { logger } from "@shared/logger";

import type {
  FileUploadData,
  UploadResult,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "../types";
import { computeFileHash } from "../utils/file-utils";
import type { LlamaCloudClient } from "../../lib/clients";

export function useFileUpload({
  onProgress,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  hashFile = false,
  externalIdPrefix = "",
  llamaCloudClient,
  filePurpose = "user_data",
}: UseFileUploadOptions): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const computeHash = async (file: File): Promise<string> => {
    return computeFileHash(file);
  };

  /**
   * Uploads a file using the LlamaCloud SDK.
   */
  const uploadWithLlamaCloudSdk = async (
    client: LlamaCloudClient,
    file: File,
    externalFileId?: string
  ): Promise<{ id: string; url?: string }> => {
    const result = await client.files.create({
      file,
      purpose: filePurpose,
      external_file_id: externalFileId,
    });

    // Get presigned URL for reading the file
    const presignedUrl = await client.files.get(result.id);

    return {
      id: result.id,
      url: presignedUrl.url,
    };
  };

  const uploadFile = async (file: File): Promise<UploadResult> => {
    if (!llamaCloudClient) {
      const error = new Error(
        "LlamaCloud client is required. Please provide llamaCloudClient via useFileUpload options or wrap your component with ApiProvider."
      );
      logger.error("uploadFile failed: no client", { error });
      onUploadError?.(file, error.message, undefined);
      return {
        success: false,
        data: null,
        error,
      };
    }

    setIsUploading(true);

    let fileHash: string | undefined;

    try {
      // Compute hash if enabled
      if (hashFile) {
        fileHash = await computeFileHash(file);
      }

      onUploadStart?.(file, fileHash);

      // Use external_file_id for deduplication
      const externalFileId = fileHash
        ? `${externalIdPrefix}${fileHash}`
        : undefined;

      onProgress?.(file, 10);
      const result = await uploadWithLlamaCloudSdk(
        llamaCloudClient,
        file,
        externalFileId
      );
      onProgress?.(file, 80);

      const fileData: FileUploadData = {
        file,
        fileId: result.id,
        url: result.url,
        fileHash,
      };

      onProgress?.(file, 100);
      onUploadComplete?.(file, fileHash);

      return {
        success: true,
        data: fileData,
        error: null,
      };
    } catch (error) {
      logger.error("uploadFile failed", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(file, errorMessage, fileHash);

      return {
        success: false,
        data: null,
        error: error as Error,
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadFile,
    uploadAndReturn: uploadFile,
    computeHash,
  };
}

export type {
  FileUploadData,
  UploadResult,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "../types";
