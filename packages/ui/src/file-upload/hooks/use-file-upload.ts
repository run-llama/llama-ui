import { useState } from "react";
import { logger } from "@shared/logger";
import {
  uploadFileApiV1FilesPost,
  readFileContentApiV1FilesIdContentGet,
  uploadFileFromUrlApiV1FilesUploadFromUrlPut,
} from "llama-cloud-services/api";

import type {
  FileUploadData,
  UploadResult,
  UploadFromUrlOptions,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "../types";

function deriveFileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pathname[pathname.length - 1];
    if (lastSegment) {
      return decodeURIComponent(lastSegment);
    }
  } catch (error) {
    logger.error("failed to parse filename from url", { error, url });
  }
  return url.replace(/[^a-z0-9_.-]/gi, "-") || "remote-file";
}

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

  const uploadFromUrl = async (
    url: string,
    options: UploadFromUrlOptions = {}
  ): Promise<UploadResult> => {
    const filename = options.name || deriveFileNameFromUrl(url);
    const virtualFile = new File([""], filename, {
      type: "text/url",
      lastModified: Date.now(),
    });

    setIsUploading(true);
    onUploadStart?.(virtualFile);

    try {
      const response = await uploadFileFromUrlApiV1FilesUploadFromUrlPut({
        body: {
          url,
          name: filename,
          proxy_url: options.proxyUrl,
          request_headers: options.requestHeaders,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const fileId = response.data.id;

      onProgress?.(virtualFile, 10);

      const contentResponse = await readFileContentApiV1FilesIdContentGet({
        path: { id: fileId },
      });

      if (contentResponse.error) {
        throw contentResponse.error;
      }

      const fileUrl = contentResponse.data.url;
      onProgress?.(virtualFile, 80);

      const fileData: FileUploadData = {
        file: virtualFile,
        fileId,
        url: fileUrl,
      };

      onProgress?.(virtualFile, 100);
      onUploadComplete?.(virtualFile);

      return { success: true, data: fileData, error: null };
    } catch (error) {
      logger.error("uploadFromUrl failed", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(virtualFile, errorMessage);

      return { success: false, data: null, error: error as Error };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadFile,
    uploadFromUrl,
    uploadAndReturn: uploadFile,
  };
}

export type {
  FileUploadData,
  UploadResult,
  UploadFromUrlOptions,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "../types";
