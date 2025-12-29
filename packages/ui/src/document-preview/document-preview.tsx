"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { DropzoneProps } from "react-dropzone";
import { cn } from "@/lib/utils";
import { PdfPreview } from "../file-preview";
import type { Highlight } from "../file-preview/types";
import { FileUpload } from "./file-upload";
import { checkUrl, getFileTypeInfo, resolveFileName } from "./files";
import { FileObjectPreview } from "./previews/file-object-preview";
import { ImagePreview } from "./previews/image-preview";
import { TextPreview } from "./previews/text-preview";
import { UnsupportedPreview } from "./previews/unsupported-preview";
import { SelectFileBar } from "./select-file-bar";
import { UploadSkeleton } from "./upload-skeleton";

type UploadableContent = File | string;

const MAX_FILE_COUNT = 20;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024 * 315;

export type UploadableItem = {
  content: UploadableContent;
  fileName?: string | null;
  id?: string;
};

export type PreviewComponentProps = {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
  className?: string;
  highlights?: Highlight[];
};

export type PreviewComponent = React.ComponentType<PreviewComponentProps>;

// Internal wrapper for PdfPreview that handles static parameters
function PdfPreviewWrapper({
  fileName,
  contentUrl,
  onRemove,
  highlights,
}: PreviewComponentProps) {
  return (
    <PdfPreview
      url={contentUrl}
      onRemove={onRemove}
      fileName={fileName}
      highlights={highlights}
      toolbarClassName="[&>div]:border-t-0 [&>div]:border-r-0 [&>div]:border-l-0"
    />
  );
}

const DEFAULT_MIME_TYPE_MAP: Record<string, PreviewComponent> = {
  "application/pdf": PdfPreviewWrapper,
  "text/plain": TextPreview,
  "text/markdown": TextPreview,
  "application/json": TextPreview,
  "image/jpeg": ImagePreview,
  "image/jpg": ImagePreview,
  "image/png": ImagePreview,
  "image/gif": ImagePreview,
  "image/bmp": ImagePreview,
  "image/tiff": ImagePreview,
  "image/x-icon": ImagePreview,
  "image/vnd.microsoft.icon": ImagePreview,
  "image/webp": ImagePreview,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    UnsupportedPreview,
  "application/vnd.ms-powerpoint": UnsupportedPreview,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    UnsupportedPreview,
};

const DEFAULT_EXTENSION_MAP: Record<string, PreviewComponent> = {
  pdf: PdfPreviewWrapper,
  txt: TextPreview,
  md: TextPreview,
  json: TextPreview,
  jpg: ImagePreview,
  jpeg: ImagePreview,
  png: ImagePreview,
  gif: ImagePreview,
  bmp: ImagePreview,
  tiff: ImagePreview,
  ico: ImagePreview,
  webp: ImagePreview,
  docx: UnsupportedPreview,
  ppt: UnsupportedPreview,
  pptx: UnsupportedPreview,
};

export type PreviewsMap = {
  mimeTypes?: Record<string, PreviewComponent>;
  extensions?: Record<string, PreviewComponent>;
};

interface DocumentPreviewBaseProps
  extends Omit<DocumentPreviewItemProps, "fileName" | "value" | "onRemove"> {
  isLoading?: boolean;
  heading?: string;
  className?: string;
  footer?: ReactNode;
  accept?: DropzoneProps["accept"];
  maxFileSize?: number;
  maxFileSizeHelpText?: string;
  onSelectFile?: () => void;
  selectFileLabel?: string;
  selectFileDescription?: string;
}

export interface DocumentPreviewSingleProps extends DocumentPreviewBaseProps {
  allowMultiple?: false;
  value: UploadableContent | null;
  onChange?: (content: UploadableContent | null) => void;
  onRemove?: () => void;
  fileName?: string | null;
}

export interface DocumentPreviewMultiProps extends DocumentPreviewBaseProps {
  allowMultiple: true;
  value: UploadableItem[];
  onChange?: (items: UploadableItem[]) => void | Promise<void>;
  onRemove?: (index: number) => void;
  onPreviewChange?: (index: number | null) => void;
}

export type DocumentPreviewProps =
  | DocumentPreviewSingleProps
  | DocumentPreviewMultiProps;

const toArray = <T,>(value: T | T[] | null): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
};

interface DocumentPreviewItemProps {
  value: UploadableContent;
  fileName?: string | null;
  onRemove?: () => void;
  allowRemoval?: boolean;
  highlights?: Highlight[];
  previews?: PreviewsMap;
}

function DocumentPreviewItem({
  value,
  onRemove,
  allowRemoval = true,
  fileName,
  highlights,
  previews,
}: DocumentPreviewItemProps) {
  // Track both the blob URL and which file it was created for
  // This prevents passing stale/revoked URLs to preview components when switching files
  const [blobInfo, setBlobInfo] = useState<{
    url: string;
    file: File;
  } | null>(null);

  useEffect(() => {
    // XXX: Don't separate this into a useMemo calling URL.createObjectURL
    // Doesn't work with multiple instances of DocumentPreviewItem
    if (!(value instanceof File)) {
      setBlobInfo(null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setBlobInfo({ url: objectUrl, file: value });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [value]);

  const resolvedUrl = useMemo(() => {
    if (value instanceof File) {
      // Only return blob URL if it was created for the current file
      // This prevents returning stale URLs when switching between files
      if (blobInfo && blobInfo.file === value) {
        return blobInfo.url;
      }
      return null;
    }
    if (typeof value === "string") {
      return checkUrl(value);
    }
    return null;
  }, [value, blobInfo]);

  if (!resolvedUrl) {
    return <UploadSkeleton />;
  }

  const { mimeType, extension } = getFileTypeInfo(value);
  const removalHandler = allowRemoval ? onRemove : undefined;

  // Merge default maps with overrides
  const mimeTypeMap = {
    ...DEFAULT_MIME_TYPE_MAP,
    ...previews?.mimeTypes,
  };
  const extensionMap = {
    ...DEFAULT_EXTENSION_MAP,
    ...previews?.extensions,
  };

  // Determine preview component: mime types take precedence over extensions
  let PreviewComponent: PreviewComponent | undefined;
  if (mimeType && mimeTypeMap[mimeType]) {
    PreviewComponent = mimeTypeMap[mimeType];
  } else if (extension && extensionMap[extension]) {
    PreviewComponent = extensionMap[extension];
  }

  // Default to file-object preview if no match found
  if (!PreviewComponent) {
    PreviewComponent = FileObjectPreview;
  }

  // Render the preview component
  const previewContent = (
    <PreviewComponent
      fileName={fileName}
      contentUrl={resolvedUrl}
      onRemove={removalHandler}
      highlights={highlights}
    />
  );

  return (
    <div className="relative size-full">
      <div className="absolute inset-0 flex flex-col">{previewContent}</div>
    </div>
  );
}

export function DocumentPreview(props: DocumentPreviewProps) {
  const {
    isLoading = false,
    heading,
    onRemove,
    allowRemoval = true,
    allowMultiple = false,
    className = "h-full w-full flex-1",
    footer,
    accept,
    previews,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    maxFileSizeHelpText = `You can upload files up to ${Math.round(DEFAULT_MAX_FILE_SIZE / 1024 / 1024)} MB`,
    onSelectFile,
    selectFileLabel,
    selectFileDescription,
  } = props;

  // Track which index should show the preview (defaults to last index)
  const [previewIndex, setPreviewIndexState] = useState<number | null>(null);
  const [isFileUploadExpanded, setIsFileUploadExpanded] = useState(false);

  if (isLoading) {
    return <UploadSkeleton />;
  }

  const multiProps = allowMultiple
    ? (props as DocumentPreviewMultiProps)
    : null;
  const singleProps = allowMultiple
    ? null
    : (props as DocumentPreviewSingleProps);

  const multiOnChange = multiProps?.onChange;
  const multiValues = multiProps?.value ?? [];
  const normalizedValues = allowMultiple
    ? multiValues.map((item) => item.content)
    : toArray(singleProps?.value ?? null);
  const normalizedFileNames = allowMultiple
    ? multiValues.map((item) => item.fileName ?? resolveFileName(item.content))
    : toArray(singleProps?.value ?? null).map(
        (content) => singleProps?.fileName ?? resolveFileName(content)
      );

  // Wrapper function to update preview index and notify parent
  const setPreviewIndex = (index: number | null) => {
    setPreviewIndexState(index);
    if (allowMultiple && multiProps?.onPreviewChange) {
      multiProps.onPreviewChange(index);
    }
  };

  const handleContentChange = (newContent: File[] | string) => {
    if (!allowMultiple) {
      if (Array.isArray(newContent)) {
        singleProps?.onChange?.(newContent[0] ?? null);
        return;
      }

      singleProps?.onChange?.(newContent);
      return;
    }

    const newContents = Array.isArray(newContent) ? newContent : [newContent];
    if (newContents.length === 0) return;

    const newItems = [
      ...multiValues,
      ...newContents.map((content) => ({ content })),
    ];
    void multiProps?.onChange?.(newItems);

    // Reset preview index to show the newly added file (last index)
    setPreviewIndex(newItems.length - 1);
  };

  const handleRemoveAt = (index: number) => {
    if (!allowRemoval) return;
    if (!allowMultiple) {
      const nextValues = normalizedValues.filter(
        (_, itemIndex) => itemIndex !== index
      );
      singleProps?.onChange?.(
        nextValues.length ? (nextValues[0] ?? null) : null
      );
      singleProps?.onRemove?.();
      return;
    }

    const nextItems = multiValues.filter((_, itemIndex) => itemIndex !== index);

    onRemove?.(index);

    void multiOnChange?.(nextItems);

    // Update preview index after removal
    if (previewIndex !== null) {
      if (previewIndex === index) {
        // If the removed item was the preview item, reset to show last item
        setPreviewIndex(nextItems.length > 0 ? nextItems.length - 1 : null);
      } else if (previewIndex > index) {
        // If the removed item was before the preview item, decrement the index
        setPreviewIndex(previewIndex - 1);
      }
      // If previewIndex < index, no change needed
    }
  };

  const handleSelectAt = (index: number) => {
    if (!allowMultiple) return;
    // Set the clicked item as the preview item without changing order
    setPreviewIndex(index);
  };

  const renderFileUpload = (options?: { variant: "small" | "normal" }) => {
    const maxFileCount = allowMultiple
      ? Math.max(0, MAX_FILE_COUNT - normalizedValues.length)
      : 1;

    // Don't show uploader if max files already uploaded
    if (maxFileCount === 0) {
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-start px-20 py-8">
        <FileUpload
          className="max-w-4xl"
          heading={heading ?? "File Upload"}
          variant={options?.variant ?? "normal"}
          onContentChange={handleContentChange}
          maxFileCount={maxFileCount}
          maxSize={maxFileSize}
          uploadDescription={`Upload ${maxFileCount > 1 ? `up to ${maxFileCount} files` : "file"} (drag or click)`}
          uploadHelpText={maxFileSizeHelpText}
          footer={footer}
          accept={accept}
          onSelectFile={onSelectFile}
          selectFileLabel={selectFileLabel}
          selectFileDescription={selectFileDescription}
        />
      </div>
    );
  };

  if (normalizedValues.length === 0) {
    return <div className={className}>{renderFileUpload()}</div>;
  }

  const lastIndex = normalizedValues.length - 1;
  // Use previewIndex if set, otherwise default to last index
  const currentPreviewIndex = previewIndex !== null ? previewIndex : lastIndex;

  const currentValue = normalizedValues[currentPreviewIndex];
  const currentFileName = normalizedFileNames[currentPreviewIndex] ?? undefined;

  const maxFileCount = allowMultiple
    ? Math.max(0, MAX_FILE_COUNT - normalizedValues.length)
    : 1;

  return (
    <div className={cn("flex flex-col", className)}>
      {allowMultiple && (
        <SelectFileBar
          files={normalizedValues.map((_, index) => ({
            fileName: normalizedFileNames[index] ?? null,
            index,
          }))}
          currentIndex={currentPreviewIndex}
          onSelect={handleSelectAt}
          onRemove={handleRemoveAt}
          onToggleFileUpload={
            maxFileCount > 0
              ? () => setIsFileUploadExpanded((prev) => !prev)
              : undefined
          }
          isFileUploadExpanded={isFileUploadExpanded}
        />
      )}
      {allowMultiple &&
        isFileUploadExpanded &&
        renderFileUpload({ variant: "small" })}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {currentValue && (
          <DocumentPreviewItem
            value={currentValue}
            // don't show file name for multiple files (as we're showing select file bar)
            fileName={allowMultiple ? undefined : currentFileName}
            onRemove={() => handleRemoveAt(currentPreviewIndex)}
            allowRemoval={allowRemoval && !allowMultiple}
            highlights={props.highlights}
            previews={previews}
          />
        )}
      </div>
    </div>
  );
}
