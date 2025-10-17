import { Button } from "@/base/button";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

import type { FileDropzoneProps } from "../types";
import { useFileDropzone } from "../hooks/use-file-dropzone";
import { Input } from "@/base/input";

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
  className,
  allowedFileTypes,
  maxFileSizeBytes,
  listFooter,
  footer,
  showRemoveButton = true,
  disabled = false,
  emptyTitle = multiple
    ? "Upload files (drag or click)"
    : "Upload file (drag or click)",
  emptyDescription,
}: FileDropzoneProps) {
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
    onFilesSelected: (files) => {
      if (!disabled) {
        onFilesSelected(files);
      }
    },
    multiple,
  });

  const hasFiles = selectedFiles.length > 0;
  const acceptValue = allowedFileTypes?.length
    ? allowedFileTypes.map((type) => `.${type}`).join(",")
    : undefined;
  const displayAllowedTypes = allowedFileTypes?.length
    ? allowedFileTypes.map((type) => type.toUpperCase()).join(", ")
    : undefined;
  const maxSizeMb =
    maxFileSizeBytes && Math.round(maxFileSizeBytes / 1000 / 1000);

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
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={(event) => {
            event.stopPropagation();
            onRemoveFile(file);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  const renderFileContent = () => {
    if (!hasFiles) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Upload className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-600">{emptyTitle}</p>
            {emptyDescription ? (
              <p className="text-xs text-muted-foreground">
                {emptyDescription}
              </p>
            ) : null}
          </div>
          {(displayAllowedTypes || maxSizeMb) && (
            <div className="space-y-1 text-xs text-muted-foreground">
              {displayAllowedTypes && !footer ? (
                <p>Supported: {displayAllowedTypes}</p>
              ) : null}
              {maxSizeMb ? <p>Max size: {maxSizeMb}MB</p> : null}
            </div>
          )}
        </div>
      );
    }

    if (multiple) {
      return (
        <div className="flex w-full flex-col gap-3">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`}>
              {renderFileRow(file)}
            </div>
          ))}
          {listFooter}
        </div>
      );
    }

    return renderFileRow(selectedFiles[0]);
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-4 rounded-lg border-2 border-dotted p-8 transition-colors",
          disabled ? "opacity-60" : "cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !disabled && isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover-border-primary/50",
          hasFiles
            ? "items-stretch text-left"
            : "items-center text-center min-h-[200px]",
          className
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
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleClick();
                }
              }
        }
      >
        <Input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={disabled ? undefined : handleFileInputChange}
          accept={acceptValue}
          multiple={multiple}
          disabled={disabled}
        />
        {renderFileContent()}
      </div>
      {footer}
    </>
  );
}
