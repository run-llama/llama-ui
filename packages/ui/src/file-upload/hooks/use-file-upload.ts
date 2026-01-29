import { useState } from "react";
import { logger } from "@shared/logger";
import {
  uploadFileApiV1FilesPost,
  readFileContentApiV1FilesIdContentGet,
} from "llama-cloud-services/api";

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
      const response = await uploadFileApiV1FilesPost({
        body: {
          upload_file: file,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const fileId = response.data.id;

      // Real API call with progress simulation
      onProgress?.(file, 10);

      // Get the file content URL using the file ID
      const contentResponse = await readFileContentApiV1FilesIdContentGet({
        path: {
          id: fileId,
        },
      });

      if (contentResponse.error) {
        throw contentResponse.error;
      }

      const fileUrl = contentResponse.data.url;
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
