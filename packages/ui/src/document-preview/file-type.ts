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

export function determinePreviewType({
  content,
  fileName,
}: {
  content: File | string | null;
  fileName?: string | null;
}): PreviewType {
  const mimeCandidate = content instanceof File ? content.type : null;

  if (mimeCandidate) {
    const normalized = mimeCandidate.split(";")[0]?.trim().toLowerCase();
    if (normalized && hasMimePreview(normalized)) {
      return MIME_TYPE_PREVIEW_MAP[normalized];
    }
    if (normalized && hasUnsupportedMime(normalized)) {
      return "unsupported";
    }
  }

  const extensionCandidates = [
    fileName ?? null,
    content instanceof File ? content.name : null,
  ].filter(Boolean) as string[];

  for (const candidate of extensionCandidates) {
    const extension = extractExtension(candidate);
    if (!extension) continue;
    if (hasExtensionPreview(extension)) {
      return EXTENSION_PREVIEW_MAP[extension];
    }
    if (hasUnsupportedExtension(extension)) {
      return "unsupported";
    }
  }

  return "file-object";
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
