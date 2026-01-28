import { useState } from "react";
import { logger } from "@shared/logger";
import {
  uploadFileApiV1FilesPost,
  readFileContentApiV1FilesIdContentGet,
  uploadFileFromUrlApiV1FilesUploadFromUrlPut,
  upsertFileApiV1BetaFilesPut,
  generatePresignedUrlApiV1FilesPut,
} from "llama-cloud-services/api";

import type {
  FileUploadData,
  UploadResult,
  UploadFromUrlOptions,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "../types";
import { computeFileHash } from "../utils/file-utils";

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
  useBetaApi = false,
  hashFile = false,
  externalIdPrefix = "",
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const computeHash = async (file: File): Promise<string> => {
    return computeFileHash(file);
  };

  /**
   * Uploads a file using the beta API with upsert capability.
   * First generates a presigned URL, then uploads the file content to that URL.
   */
  const uploadWithBetaApi = async (
    file: File,
    externalFileId?: string
  ): Promise<{ id: string }> => {
    // Use the beta upsert endpoint which creates or updates based on external_file_id
    const response = await upsertFileApiV1BetaFilesPut({
      body: {
        name: file.name,
        external_file_id: externalFileId,
        file_size: file.size,
      },
    });

    if (response.error) {
      throw response.error;
    }

    const fileId = response.data.id;

    // Generate presigned URL for upload
    const presignedResponse = await generatePresignedUrlApiV1FilesPut({
      body: {
        name: file.name,
        file_size: file.size,
      },
    });

    if (presignedResponse.error) {
      throw presignedResponse.error;
    }

    // Upload file content to presigned URL
    const uploadUrl = presignedResponse.data.presigned_url;
    if (uploadUrl) {
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file content: ${uploadResponse.statusText}`);
      }
    }

    return { id: fileId };
  };

  const uploadFile = async (file: File): Promise<UploadResult> => {
    setIsUploading(true);

    let fileHash: string | undefined;

    try {
      // Compute hash if enabled
      if (hashFile) {
        fileHash = await computeFileHash(file);
      }

      onUploadStart?.(file, fileHash);

      let fileId: string;

      if (useBetaApi) {
        // Use beta API with external_file_id for deduplication
        const externalFileId = fileHash
          ? `${externalIdPrefix}${fileHash}`
          : undefined;
        const result = await uploadWithBetaApi(file, externalFileId);
        fileId = result.id;
      } else {
        // Use standard API
        const response = await uploadFileApiV1FilesPost({
          body: {
            upload_file: file,
          },
        });

        if (response.error) {
          throw response.error;
        }

        fileId = response.data.id;
      }

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
    // URL uploads don't support file hashing since content isn't available locally
    onUploadStart?.(virtualFile, undefined);

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
        // No hash for URL uploads
      };

      onProgress?.(virtualFile, 100);
      onUploadComplete?.(virtualFile, undefined);

      return { success: true, data: fileData, error: null };
    } catch (error) {
      logger.error("uploadFromUrl failed", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(virtualFile, errorMessage, undefined);

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
    computeHash,
  };
}

export type {
  FileUploadData,
  UploadResult,
  UploadFromUrlOptions,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "../types";
