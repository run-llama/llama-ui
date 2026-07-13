import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/base/button";
import { Input } from "@/base/input";
import { UploadZone } from "@/base/upload-zone";
import { cn } from "@/lib/utils";
import type { FileDropzoneProps } from "../types";
import { useFileDropzone } from "../hooks/use-file-dropzone";
import { validateFile } from "../utils/file-utils";

const unitLabels = ["B", "KB", "MB", "GB"];

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";

  let size = bytes;
  let index = 0;

  while (size >= 1024 && index < unitLabels.length - 1) {
    size /= 1024;
    index += 1;
  }

  const precision = size < 10 && index > 0 ? 1 : 0;
  return `${size.toFixed(precision)} ${unitLabels[index]}`;
}

export function FileDropzone({
  multiple = false,
  selectedFiles = [],
  onFilesSelected,
  onRemoveFile,
  allowedFileTypes,
  supportedFiles,
  showRemoveButton = true,
  disabled = false,
  title = multiple ? "Drag files here to upload" : "Drag file here to upload",
  description,
  maxFileSizeBytes,
}: FileDropzoneProps) {
  const handleFilesWithValidation = (files: File[]) => {
    if (disabled) return;

    const validFiles: File[] = [];
    files.forEach((file) => {
      const validationError = validateFile(
        file,
        allowedFileTypes,
        maxFileSizeBytes
      );
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const {
    inputRef,
    isDragging,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleClick,
  } = useFileDropzone({
    onFilesSelected: handleFilesWithValidation,
    multiple,
  });

  const hasFiles = selectedFiles.length > 0;
  const acceptValue = allowedFileTypes?.length
    ? allowedFileTypes.map((type) => `.${type}`).join(",")
    : undefined;
  const displaySupportedFiles =
    supportedFiles ??
    (allowedFileTypes?.length
      ? `Supported: ${allowedFileTypes.map((type) => type.toUpperCase()).join(", ")}`
      : undefined);

  const renderFileRow = (file: File) => (
    <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Upload className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{file.name}</span>
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </span>
      </div>
      {showRemoveButton && onRemoveFile && (
        <Button
          variant="ghost"
          size="icon-sm"
          startIcon={<X />}
          onClick={(event) => {
            event.stopPropagation();
            onRemoveFile(file);
          }}
        />
      )}
    </div>
  );

  const renderEmptyContent = () => (
    <UploadZone
      state={isDragging ? "focus" : "default"}
      title={title}
      description={description}
      supportedFiles={displaySupportedFiles}
    />
  );

  const renderFileList = () => {
    if (multiple) {
      return (
        <div className="flex w-full flex-col gap-3">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`}>
              {renderFileRow(file)}
            </div>
          ))}
        </div>
      );
    }
    return renderFileRow(selectedFiles[0]);
  };

  // Custom dashed border with wider spacing (8px dash, 8px gap)
  const borderColor =
    hasFiles && !disabled && isDragging
      ? "var(--muted-foreground)"
      : "var(--ring)";

  return (
    <div
      className={cn(
        "flex h-full flex-1 flex-col",
        disabled ? "opacity-60" : "cursor-pointer",
        hasFiles &&
          "relative gap-4 rounded-2xl px-4 py-6 transition-all items-stretch text-left",
        hasFiles &&
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
        hasFiles &&
          (!disabled && isDragging
            ? "bg-muted ring-[3px] ring-ring/20"
            : "bg-card")
      )}
      onDragEnter={disabled ? undefined : handleDragEnter}
      onDragLeave={disabled ? undefined : handleDragLeave}
      onDragOver={disabled ? undefined : handleDragOver}
      onDrop={disabled ? undefined : handleDrop}
      onClick={disabled ? undefined : handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={
        disabled
          ? undefined
          : (event) => {
              // Only open file picker if no files are selected
              // When files are selected, allow Enter to bubble up for form submission
              if (event.key === " " || (event.key === "Enter" && !hasFiles)) {
                event.preventDefault();
                handleClick();
              }
            }
      }
    >
      {/* SVG dashed border - only shown when files are selected */}
      {hasFiles && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          fill="none"
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="16"
            ry="16"
            stroke={borderColor}
            strokeWidth="1"
            strokeDasharray="8 8"
            strokeLinecap="square"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      <div className="hidden">
        <Input
          ref={inputRef}
          type="file"
          onChange={disabled ? undefined : handleFileInputChange}
          accept={acceptValue}
          multiple={multiple}
          disabled={disabled}
        />
      </div>
      {hasFiles ? renderFileList() : renderEmptyContent()}
    </div>
  );
}
