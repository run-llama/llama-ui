import { useState } from "react";
import { logger } from "@shared/logger";
import { getStainlessClient } from "../../lib/stainless-client";

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
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    onUploadStart?.(file);

    try {
      const client = getStainlessClient();

      const response = await client.files.create({
        file: file,
        purpose: "user_data",
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
      };

      onProgress?.(file, 100);
      onUploadComplete?.(file);

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
