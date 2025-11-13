const MIME_TYPE_PREVIEW_MAP = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "sheet",
  "application/vnd.ms-excel": "sheet",
  "text/csv": "sheet",
  "text/plain": "text",
  "text/markdown": "text",
  "application/json": "text",
} as const;

const MIME_TYPE_UNSUPPORTED_MAP = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
  "application/vnd.ms-powerpoint": true,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
} as const;

const EXTENSION_PREVIEW_MAP = {
  pdf: "pdf",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  txt: "text",
  md: "text",
  json: "text",
} as const;

const EXTENSION_UNSUPPORTED_MAP = {
  docx: true,
  ppt: true,
  pptx: true,
} as const;

type PreviewType = "pdf" | "sheet" | "text" | "file-object" | "unsupported";

function hasMimePreview(
  mime: string
): mime is keyof typeof MIME_TYPE_PREVIEW_MAP {
  return Object.hasOwn(MIME_TYPE_PREVIEW_MAP, mime);
}

function hasUnsupportedMime(
  mime: string
): mime is keyof typeof MIME_TYPE_UNSUPPORTED_MAP {
  return Object.hasOwn(MIME_TYPE_UNSUPPORTED_MAP, mime);
}

function hasExtensionPreview(
  extension: string
): extension is keyof typeof EXTENSION_PREVIEW_MAP {
  return Object.hasOwn(EXTENSION_PREVIEW_MAP, extension);
}

function hasUnsupportedExtension(
  extension: string
): extension is keyof typeof EXTENSION_UNSUPPORTED_MAP {
  return Object.hasOwn(EXTENSION_UNSUPPORTED_MAP, extension);
}

function extractExtension(candidate: string | null | undefined) {
  if (!candidate) return null;
  const sanitized = candidate.split(/[?#]/)[0];
  const segments = sanitized?.split(".");
  if (!segments || segments.length < 2) return null;
  const extension = segments.pop();
  return extension ? extension.toLowerCase() : null;
}

export function determinePreviewType(content: File | string): PreviewType {
  // Handle File objects
  if (content instanceof File) {
    // First check mime type
    if (content.type) {
      const normalized = content.type.split(";")[0]?.trim().toLowerCase();
      if (normalized && hasMimePreview(normalized)) {
        return MIME_TYPE_PREVIEW_MAP[normalized];
      }
      if (normalized && hasUnsupportedMime(normalized)) {
        return "unsupported";
      }
    }

    // Fall back to file name extension
    if (content.name) {
      const extension = extractExtension(content.name);
      if (extension) {
        if (hasExtensionPreview(extension)) {
          return EXTENSION_PREVIEW_MAP[extension];
        }
        if (hasUnsupportedExtension(extension)) {
          return "unsupported";
        }
      }
    }

    return "file-object";
  }

  // Handle string URLs (including data URLs)
  if (typeof content === "string") {
    // Check for data URL format: data:mime/type;base64,...
    if (content.startsWith("data:")) {
      const mimeMatch = content.match(/^data:([^;]+)/);
      if (mimeMatch) {
        const normalized = mimeMatch[1].trim().toLowerCase();
        if (normalized && hasMimePreview(normalized)) {
          return MIME_TYPE_PREVIEW_MAP[normalized];
        }
        if (normalized && hasUnsupportedMime(normalized)) {
          return "unsupported";
        }
      }
      // If data URL doesn't have a recognized mime type, fall through to extension check
    }

    // Extract extension from URL pathname
    try {
      const urlObj = new URL(content);
      const extension = extractExtension(urlObj.pathname);
      if (extension) {
        if (hasExtensionPreview(extension)) {
          return EXTENSION_PREVIEW_MAP[extension];
        }
        if (hasUnsupportedExtension(extension)) {
          return "unsupported";
        }
      }
    } catch {
      // Invalid URL, try to extract extension from the string directly
      const extension = extractExtension(content);
      if (extension) {
        if (hasExtensionPreview(extension)) {
          return EXTENSION_PREVIEW_MAP[extension];
        }
        if (hasUnsupportedExtension(extension)) {
          return "unsupported";
        }
      }
    }

    return "file-object";
  }

  return "file-object";
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
