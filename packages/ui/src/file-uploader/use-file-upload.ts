import { useState } from "react";
import {
  uploadFileApiV1FilesPost,
  readFileContentApiV1FilesIdContentGet,
  uploadFileFromUrlApiV1FilesUploadFromUrlPut
} from "llama-cloud-services/api";

function deriveFileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pathname[pathname.length - 1];
    if (lastSegment) {
      return decodeURIComponent(lastSegment);
    }
  } catch {
    // Ignore parsing errors and fall back
  }
  return url.replace(/[^a-z0-9_.-]/gi, "-") || "remote-file";
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
  uploadFromUrl: (url: string, options?: { name?: string; proxyUrl?: string; requestHeaders?: Record<string, string>; }) => Promise<UploadResult>;
  uploadAndReturn: (file: File) => Promise<UploadResult>;
}

export function useFileUpload({
  onProgress,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAndReturn = async (file: File): Promise<UploadResult> => {
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
      // eslint-disable-next-line no-console
      console.error("Upload error:", error);
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
    options: { name?: string; proxyUrl?: string; requestHeaders?: Record<string, string> } = {},
  ): Promise<UploadResult> => {
    const filename = options.name || deriveFileNameFromUrl(url);
    const virtualFile = new File([""], filename, { type: "text/url", lastModified: Date.now() });

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
      // eslint-disable-next-line no-console
      console.error("Upload error:", error);
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
    uploadAndReturn,
    uploadFromUrl,
  };
}
