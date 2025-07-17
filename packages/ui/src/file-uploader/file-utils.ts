/**
 * Supported file types for document parsing and extraction
 */
export enum FileType {
  // Images (for document processing and extraction)
  JPEG = "jpeg",
  JPG = "jpg",
  PNG = "png",
  WEBP = "webp",

  // Documents (primary use case)
  PDF = "pdf",
  DOC = "doc",
  DOCX = "docx",
  XLS = "xls",
  XLSX = "xlsx",
  PPT = "ppt",
  PPTX = "pptx",

  // Text files (can be parsed and indexed)
  TXT = "txt",
  CSV = "csv",
  JSON = "json",
  XML = "xml",
  HTML = "html",
  CSS = "css",
  JS = "js",
  TS = "ts",
  MD = "md",
}

/**
 * File type definitions with extensions, MIME types, and display names
 */
const FILE_TYPE_DEFINITIONS: Record<
  FileType,
  {
    extensions: string[];
    mimeTypes: string[];
    displayName: string;
    category: string;
  }
> = {
  [FileType.JPEG]: {
    extensions: ["jpg", "jpeg"],
    mimeTypes: ["image/jpeg", "image/jpg"],
    displayName: "JPEG Image",
    category: "image",
  },
  [FileType.JPG]: {
    extensions: ["jpg", "jpeg"],
    mimeTypes: ["image/jpeg", "image/jpg"],
    displayName: "JPG Image",
    category: "image",
  },
  [FileType.PNG]: {
    extensions: ["png"],
    mimeTypes: ["image/png"],
    displayName: "PNG Image",
    category: "image",
  },
  [FileType.WEBP]: {
    extensions: ["webp"],
    mimeTypes: ["image/webp"],
    displayName: "WebP Image",
    category: "image",
  },
  [FileType.PDF]: {
    extensions: ["pdf"],
    mimeTypes: ["application/pdf"],
    displayName: "PDF Document",
    category: "document",
  },
  [FileType.DOC]: {
    extensions: ["doc"],
    mimeTypes: ["application/msword"],
    displayName: "Word Document",
    category: "document",
  },
  [FileType.DOCX]: {
    extensions: ["docx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    displayName: "Word Document",
    category: "document",
  },
  [FileType.XLS]: {
    extensions: ["xls"],
    mimeTypes: ["application/vnd.ms-excel"],
    displayName: "Excel Spreadsheet",
    category: "document",
  },
  [FileType.XLSX]: {
    extensions: ["xlsx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    displayName: "Excel Spreadsheet",
    category: "document",
  },
  [FileType.PPT]: {
    extensions: ["ppt"],
    mimeTypes: ["application/vnd.ms-powerpoint"],
    displayName: "PowerPoint Presentation",
    category: "document",
  },
  [FileType.PPTX]: {
    extensions: ["pptx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    displayName: "PowerPoint Presentation",
    category: "document",
  },
  [FileType.TXT]: {
    extensions: ["txt"],
    mimeTypes: ["text/plain"],
    displayName: "Text File",
    category: "text",
  },
  [FileType.CSV]: {
    extensions: ["csv"],
    mimeTypes: ["text/csv"],
    displayName: "CSV File",
    category: "text",
  },
  [FileType.JSON]: {
    extensions: ["json"],
    mimeTypes: ["application/json"],
    displayName: "JSON File",
    category: "text",
  },
  [FileType.XML]: {
    extensions: ["xml"],
    mimeTypes: ["application/xml", "text/xml"],
    displayName: "XML File",
    category: "text",
  },
  [FileType.HTML]: {
    extensions: ["html", "htm"],
    mimeTypes: ["text/html"],
    displayName: "HTML File",
    category: "text",
  },
  [FileType.CSS]: {
    extensions: ["css"],
    mimeTypes: ["text/css"],
    displayName: "CSS File",
    category: "text",
  },
  [FileType.JS]: {
    extensions: ["js"],
    mimeTypes: ["application/javascript", "text/javascript"],
    displayName: "JavaScript File",
    category: "text",
  },
  [FileType.TS]: {
    extensions: ["ts"],
    mimeTypes: ["application/typescript", "text/typescript"],
    displayName: "TypeScript File",
    category: "text",
  },
  [FileType.MD]: {
    extensions: ["md", "markdown"],
    mimeTypes: ["text/markdown"],
    displayName: "Markdown File",
    category: "text",
  },
};

/**
 * Predefined file type groups for common use cases
 */
export const FILE_TYPE_GROUPS = {
  IMAGES: [FileType.JPEG, FileType.JPG, FileType.PNG, FileType.WEBP],
  DOCUMENTS: [
    FileType.PDF,
    FileType.DOC,
    FileType.DOCX,
    FileType.XLS,
    FileType.XLSX,
    FileType.PPT,
    FileType.PPTX,
  ],
  TEXT: [
    FileType.TXT,
    FileType.CSV,
    FileType.JSON,
    FileType.XML,
    FileType.HTML,
    FileType.CSS,
    FileType.JS,
    FileType.TS,
    FileType.MD,
  ],
  SPREADSHEETS: [FileType.XLS, FileType.XLSX, FileType.CSV],
  PRESENTATIONS: [FileType.PPT, FileType.PPTX],
  COMMON_IMAGES: [FileType.JPEG, FileType.JPG, FileType.PNG, FileType.WEBP],
  OFFICE_DOCS: [
    FileType.PDF,
    FileType.DOC,
    FileType.DOCX,
    FileType.XLS,
    FileType.XLSX,
    FileType.PPT,
    FileType.PPTX,
  ],
};

/**
 * Gets file type definition by FileType enum
 */
export const getFileTypeDefinition = (fileType: FileType) => {
  return FILE_TYPE_DEFINITIONS[fileType];
};

/**
 * Gets all supported extensions for a FileType
 */
export const getFileExtensions = (fileType: FileType): string[] => {
  return FILE_TYPE_DEFINITIONS[fileType].extensions;
};

/**
 * Gets all supported MIME types for a FileType
 */
export const getFileMimeTypes = (fileType: FileType): string[] => {
  return FILE_TYPE_DEFINITIONS[fileType].mimeTypes;
};

/**
 * Checks if a file matches the given FileType
 */
export const isFileTypeMatch = (file: File, fileType: FileType): boolean => {
  const definition = FILE_TYPE_DEFINITIONS[fileType];
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  // Check extension match
  const extensionMatch =
    fileExtension && definition.extensions.includes(fileExtension);

  // Check MIME type match
  const mimeTypeMatch = definition.mimeTypes.includes(file.type);

  return extensionMatch || mimeTypeMatch;
};

/**
 * File validation with FileType enum system
 */
export const validateFile = (
  file: File,
  allowedFileTypes: FileType[] = [],
  maxFileSizeBytes: number = 10 * 1000 * 1000, // 10MB in decimal
): string | null => {
  // Check file size
  if (file.size > maxFileSizeBytes) {
    return `File size exceeds ${Math.round(maxFileSizeBytes / 1000 / 1000)}MB limit`;
  }

  // Check file type if restrictions are specified
  if (allowedFileTypes.length > 0) {
    const isValidType = allowedFileTypes.some((fileType) => {
      return isFileTypeMatch(file, fileType);
    });

    if (!isValidType) {
      const allowedTypeNames = allowedFileTypes.map((fileType) => {
        return FILE_TYPE_DEFINITIONS[fileType].displayName;
      });
      return `File type not allowed. Allowed types: ${allowedTypeNames.join(", ")}`;
    }
  }

  return null;
};

/**
 * Gets all file types by category
 */
export const getFileTypesByCategory = (category: string): FileType[] => {
  return Object.entries(FILE_TYPE_DEFINITIONS)
    .filter(([, definition]) => definition.category === category)
    .map(([fileType]) => fileType as FileType);
};

/**
 * Creates a validation function for a specific file type group
 */
export const createFileTypeValidator = (
  allowedTypes: FileType[],
  maxSizeBytes = 10 * 1000 * 1000,
) => {
  return (file: File) => validateFile(file, allowedTypes, maxSizeBytes);
};

/**
 * Formats file size in human-readable format using decimal (SI) units
 * Uses powers of 1000 for true KB, MB, GB calculations
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1000;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Checks if the current environment supports the File API
 */
export const isFileApiSupported = (): boolean => {
  return typeof File !== "undefined" && typeof FileReader !== "undefined";
};

/**
 * Checks if the current environment supports the Web Crypto API
 */
export const isCryptoSupported = (): boolean => {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
};
