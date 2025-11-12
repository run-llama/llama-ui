"use client";

import { Upload } from "lucide-react";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import Dropzone, {
  type DropzoneProps,
  type FileRejection,
} from "react-dropzone";
import { toast } from "sonner";
import { Input } from "@/base/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/base/tabs";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  className?: string;
  heading?: string;
  onContentChange: (content: File[] | string) => void;
  uploadDescription?: string;
  uploadHelpText?: string;
  fileUrlPlaceholder?: string;
  footer?: ReactNode;
  variant?: "small" | "normal";
  accept?: DropzoneProps["accept"];
  maxSize?: DropzoneProps["maxSize"];
  maxFileCount?: DropzoneProps["maxFiles"];
}

export function FileUpload({
  className,
  heading = "File Upload",
  onContentChange,
  uploadDescription = "Upload file (drag or click)",
  uploadHelpText = "You can upload a file up to 315 MB",
  fileUrlPlaceholder = "Paste the file link here",
  footer,
  variant = "normal",
  accept,
  maxSize,
  maxFileCount = 1,
}: FileUploadProps) {
  const [fileUrlInput, setFileUrlInput] = useState("");

  const handleUrlSubmit = useCallback(() => {
    const trimmedUrl = fileUrlInput.trim();
    if (!trimmedUrl) {
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }

    onContentChange(trimmedUrl);
    setFileUrlInput("");
  }, [fileUrlInput, onContentChange]);

  const defaultFooter = useMemo(() => {
    if (!accept || typeof accept !== "object") return null;
    const extensions = Object.values(accept).flat();
    if (extensions.length === 0) return null;
    // need to use slice(1) to remove the dot from the extension
    const formats = extensions
      .map((ext) => ext.slice(1).toUpperCase())
      .join(", ");
    return <span>Supported file formats: {formats}</span>;
  }, [accept]);

  const displayFooter = footer ?? defaultFooter;

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

  // Accept all files, but filter out .json in custom validator
  const dropzoneContent = (
    <Dropzone
      onDrop={onDrop}
      accept={accept}
      maxSize={maxSize}
      maxFiles={maxFileCount}
      multiple={maxFileCount > 1}
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div
          {...getRootProps()}
          className={cn(
            "flex min-h-[200px] cursor-pointer items-center justify-center rounded-lg border-2 border-dotted p-8 text-center transition-colors",
            isDragActive
              ? "bg-primary/5 border-primary"
              : "hover:border-primary/50 border-gray-300"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Upload className="h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-gray-600">
              {uploadDescription}
            </p>
            <p className="text-xs text-gray-400">{uploadHelpText}</p>
          </div>
        </div>
      )}
    </Dropzone>
  );

  return (
    <div className={cn("w-full", className)}>
      {variant === "normal" && (
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "#F3F0FF", color: "#8B5CF6" }}
            >
              <Logo />
            </div>
          </div>
          <h1 className="mb-8 text-sm font-semibold">{heading}</h1>
        </div>
      )}

      {variant === "small" ? (
        dropzoneContent
      ) : (
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-gray-200 bg-transparent p-0">
            <TabsTrigger
              value="upload"
              className="rounded-none border-x-0 border-b-2 border-t-0 border-transparent bg-transparent text-xs font-semibold text-gray-500 shadow-none data-[state=active]:border-b-[#8B5CF6] data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none"
            >
              Upload file
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="rounded-none border-x-0 border-b-2 border-t-0 border-transparent bg-transparent text-xs font-semibold text-gray-500 shadow-none data-[state=active]:border-b-[#8B5CF6] data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none"
            >
              File URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            {dropzoneContent}
          </TabsContent>

          <TabsContent value="url" className="mt-6">
            <div className="rounded-lg border-2 border-gray-200 p-8">
              <Input
                type="url"
                className="w-full"
                placeholder={fileUrlPlaceholder}
                value={fileUrlInput}
                onChange={(event) => setFileUrlInput(event.target.value)}
                onBlur={handleUrlSubmit}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}

      {variant === "normal" && displayFooter ? (
        <div className="mt-6 rounded-md bg-gray-100 p-4 text-center text-xs text-gray-500">
          {displayFooter}
        </div>
      ) : null}
    </div>
  );
}

function Logo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2V8H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 13H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 9H9H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
