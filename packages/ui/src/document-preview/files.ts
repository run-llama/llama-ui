function extractExtension(candidate: string | null | undefined) {
  if (!candidate) return null;
  const sanitized = candidate.split(/[?#]/)[0];
  const segments = sanitized?.split(".");
  if (!segments || segments.length < 2) return null;
  const extension = segments.pop();
  return extension ? extension.toLowerCase() : null;
}

/**
 * Extracts mime type and extension from a File or string content.
 * @param content - File object or string URL
 * @returns Object with mimeType and extension properties (both can be null)
 */
export function getFileTypeInfo(content: File | string): {
  mimeType: string | null;
  extension: string | null;
} {
  // Handle File objects
  if (content instanceof File) {
    const mimeType = content.type
      ? content.type.split(";")[0]?.trim().toLowerCase() || null
      : null;
    const extension = content.name ? extractExtension(content.name) : null;
    return { mimeType, extension };
  }

  // Handle string URLs (including data URLs)
  if (typeof content === "string") {
    let mimeType: string | null = null;
    let extension: string | null = null;

    // Check for data URL format: data:mime/type;base64,...
    if (content.startsWith("data:")) {
      const mimeMatch = content.match(/^data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1].trim().toLowerCase();
      }
    }

    // Extract extension from URL pathname
    try {
      const urlObj = new URL(content);
      extension = extractExtension(urlObj.pathname);

      // If no extension found in pathname, check contentDisposition for filename (S3 specific)
      if (!extension) {
        const contentDisposition = urlObj.searchParams.get(
          "response-content-disposition"
        );
        if (contentDisposition) {
          // Extract filename from content-disposition header format:
          // attachment; filename="CornCostReturn.xlsx" or filename="file.xlsx"
          const filenameMatch = contentDisposition.match(
            /filename[^;=]*=([^;]+)/
          );
          if (filenameMatch) {
            // Remove quotes and decode URI component
            const filename = decodeURIComponent(
              filenameMatch[1].trim().replace(/^["']|["']$/g, "")
            );
            extension = extractExtension(filename);
          }
        }
      }
    } catch {
      // Invalid URL, try to extract extension from the string directly
      extension = extractExtension(content);
    }

    return { mimeType, extension };
  }

  return { mimeType: null, extension: null };
}

/**
 * Checks if a string is a valid URL format (data URL, absolute URL, or relative URL).
 *
 * @param value - The URL string to check
 * @returns The string if it's a valid URL format, null otherwise
 */
export function checkUrl(value: string): string | null {
  // Handle data URLs
  if (value.startsWith("data:")) {
    return value;
  }
  // Handle absolute URLs
  try {
    new URL(value);
    return value;
  } catch {
    // Check if it's a relative URL (starts with /, ./, or ../)
    if (
      value.startsWith("/") ||
      value.startsWith("./") ||
      value.startsWith("../")
    ) {
      return value;
    }
    // Not a valid URL format
    return null;
  }
}

/**
 * Resolves file name from content.
 * Extracts filename from File objects or URL strings.
 */
export const resolveFileName = (content: File | string): string | null => {
  if (content instanceof File) return content.name;
  if (typeof content === "string") {
    try {
      const urlObj = new URL(content);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      if (segments.length === 0) return null;
      const last = decodeURIComponent(segments[segments.length - 1] || "");
      // Return null if the last segment doesn't look like a filename (no extension)
      // This distinguishes directories from files
      if (!last || !last.includes(".")) return null;
      return last;
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    }
  }
  return null;
};

/**
 * Downloads a file by creating a temporary anchor element and triggering a click.
 * @param contentUrl - The URL of the file to download
 * @param fileName - Optional filename for the download
 */
export const downloadFile = (contentUrl: string, fileName?: string | null) => {
  const link = document.createElement("a");
  link.href = contentUrl;
  link.download = fileName ?? "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export type FileItemType = "file" | "directory" | "upload";

/**
 * Determines the type of a file item based on its content.
 * @param content - File object or string content
 * @returns "file" for file_id://, "directory" for directory_id://, "upload" otherwise
 */
export const getFileItemType = (content: File | string): FileItemType => {
  if (typeof content === "string") {
    if (content.startsWith("file_id://")) return "file";
    if (content.startsWith("directory_id://")) return "directory";
  }
  return "upload";
};

/**
 * Checks if a content string is a file system selection (file_id:// or directory_id://).
 * @param content - File object or string content
 * @returns true if content is a file system selection
 */
export const isFileSystemSelection = (content: File | string): boolean => {
  return (
    typeof content === "string" &&
    (content.startsWith("file_id://") || content.startsWith("directory_id://"))
  );
};

/**
 * Extracts file IDs from an array of content values.
 * Only returns IDs for file system selections (file_id:// or directory_id://).
 * @param values - Array of File objects or string content
 * @returns Array of file system selection strings
 */
export const getSelectedFileIds = (values: (File | string)[]): string[] => {
  return values.filter(
    (content): content is string =>
      typeof content === "string" && isFileSystemSelection(content)
  );
};
