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

  const renderFileContent = () => {
    if (!hasFiles) {
      return (
        <div className="flex max-w-[384px] flex-col items-center gap-4">
          <Upload className="h-5 w-5 text-neutral-500" />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-base font-medium text-foreground">{emptyTitle}</p>
            {emptyDescription ? (
              <p className="text-sm text-muted-foreground">
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
          "flex flex-col gap-4 rounded-lg border border-dashed p-8 transition-all",
          disabled ? "opacity-60" : "cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-neutral-950/10",
          !disabled && isDragging
            ? "border-neutral-400 bg-neutral-100 ring-[3px] ring-neutral-950/10"
            : "border-neutral-300 bg-white hover:border-neutral-400",
          hasFiles
            ? "items-stretch text-left"
            : "items-center justify-center text-center min-h-[200px]",
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
        {renderFileContent()}
      </div>
      {footer}
    </>
  );
}
