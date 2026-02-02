import { useState } from "react";
import { logger } from "@shared/logger";
import { getCloudClient } from "../../lib/cloud-client";
import { hashFile } from "../utils/file-utils";

import type {
  FileUploadData,
  UploadResult,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "../types";

export function useFileUpload({
  onProgress,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  hashingOptions,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    onUploadStart?.(file);

    try {
      const client = getCloudClient();

      // Compute file hash if hashing is enabled
      let fileHash: string | undefined;
      if (hashingOptions?.enabled) {
        fileHash = await hashFile(file);
      }

      // Build external_id from hash with optional prefix
      const externalId =
        fileHash && hashingOptions
          ? `${hashingOptions.externalIdPrefix ?? ""}${fileHash}`
          : undefined;

      const response = await client.files.create({
        file: file,
        purpose: "user_data",
        ...(externalId && { external_id: externalId }),
      });

      const fileId = response.id;

      // Real API call with progress simulation
      onProgress?.(file, 10);

      // Get the file content URL using the file ID
      const contentResponse = await client.files.get(fileId);

      const fileUrl = contentResponse.url;
      onProgress?.(file, 80);

      const fileData: FileUploadData = {
        file,
        fileId,
        url: fileUrl,
        ...(fileHash && { hash: fileHash }),
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
      onUploadError?.(file, errorMessage);

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
  };
}

export type {
  FileUploadData,
  UploadResult,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "../types";
