"use client";

import { FolderOpen } from "lucide-react";
import { useCallback, useMemo } from "react";
import Dropzone, {
  type DropzoneProps,
  type FileRejection,
} from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/base/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/base/tabs";
import { UploadZone } from "@/base/upload-zone";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  className?: string;
  onContentChange: (content: File[]) => void;
  title?: string;
  description?: string;
  supportedFiles?: string;
  variant?: "small" | "normal";
  accept?: DropzoneProps["accept"];
  maxSize?: DropzoneProps["maxSize"];
  maxFileCount?: DropzoneProps["maxFiles"];
  onSelectFile?: () => void;
  selectFileLabel?: string;
  selectFileDescription?: string;
}

export function FileUpload({
  className,
  onContentChange,
  title = "Drag files here to upload",
  description = "Up to 20 files, 315 MB total",
  supportedFiles,
  variant = "normal",
  accept,
  maxSize,
  maxFileCount = 1,
  onSelectFile,
  selectFileLabel = "Select file",
  selectFileDescription = "Choose a file from your existing files",
}: FileUploadProps) {
  const defaultSupportedFiles = useMemo(() => {
    if (supportedFiles) return supportedFiles;
    if (!accept || typeof accept !== "object") return null;
    const extensions = Object.values(accept).flat();
    if (extensions.length === 0) return null;
    const formats = extensions
      .map((ext) => ext.slice(1).toUpperCase())
      .join(", ");
    return `Supported file formats: ${formats}`;
  }, [accept, supportedFiles]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Check if any rejections are due to too-many-files
      const tooManyFilesRejections = rejectedFiles.filter(({ errors }) =>
        errors.some((error) => error.code === "too-many-files")
      );

      // Show consolidated error for maxFiles limit
      if (tooManyFilesRejections.length > 0) {
        toast.error(
          `Cannot upload more than ${maxFileCount} file${maxFileCount === 1 ? "" : "s"}`
        );
      }

      // Show individual errors for other rejection reasons (file type, size, etc.)
      const otherRejections = rejectedFiles.filter(
        ({ errors }) => !errors.some((error) => error.code === "too-many-files")
      );
      if (otherRejections.length > 0) {
        otherRejections.forEach(({ file, errors }) => {
          // Check if error is due to file type rejection
          const hasFileTypeError = errors.some(
            (error) => error.code === "file-invalid-type"
          );
          const errorMessage = hasFileTypeError
            ? "File type is not supported"
            : errors.map((e) => e.message).join(", ");
          toast.error(`File ${file.name} was rejected: ${errorMessage}`);
        });
      }

      // Process accepted files
      if (acceptedFiles.length > 0) {
        onContentChange(acceptedFiles);
      }
    },
    [maxFileCount, onContentChange]
  );

  const dropzoneContent = (
    <Dropzone
      onDrop={onDrop}
      accept={accept}
      maxSize={maxSize}
      maxFiles={maxFileCount}
      multiple={maxFileCount > 1}
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div {...getRootProps()} className="flex h-full flex-1 cursor-pointer">
          <input {...getInputProps()} />
          <UploadZone
            state={isDragActive ? "focus" : "default"}
            title={title}
            description={description}
            supportedFiles={defaultSupportedFiles ?? undefined}
          />
        </div>
      )}
    </Dropzone>
  );

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      {variant === "small" || !onSelectFile ? (
        dropzoneContent
      ) : (
        <Tabs
          defaultValue="upload"
          className="flex h-full flex-1 flex-col items-center"
        >
          <TabsList>
            <TabsTrigger value="upload" label="Upload file" />
            <TabsTrigger value="select" label="Select file" />
          </TabsList>

          <TabsContent
            value="upload"
            className="mt-4 flex w-full flex-1 flex-col"
          >
            {dropzoneContent}
          </TabsContent>

          <TabsContent
            value="select"
            className="mt-4 flex w-full flex-1 flex-col"
          >
            <div className="flex h-full min-h-[200px] flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <FolderOpen className="h-8 w-8 text-neutral-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {selectFileDescription}
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={onSelectFile}
                label={selectFileLabel}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
