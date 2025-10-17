"use client";

import { Input } from "@/base/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/base/tabs";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

import { FileDropzone } from "./dropzone";
import type { FileUploadProps } from "../types";
import { fa } from "zod/v4/locales";

export function FileUpload({
  className,
  heading,
  content,
  onContentChange,
  allowFileRemoval = false,
  showHeader = true,
  allowedFileTypes = [],
  maxFileSizeBytes,
  uploadDescription = "Upload file (drag or click)",
  fileUrlPlaceholder = "Paste the file link here",
  disableWhenHasSelection = false,
  footer,
}: FileUploadProps) {
  const selectedFile = content instanceof File ? content : null;

  const handleFilesSelected = (files: File[]) => {
    const [file] = files;
    if (file) {
      onContentChange(file);
    }
  };

  const handleRemoveFile = (file: File) => {
    if (
      allowFileRemoval &&
      selectedFile &&
      selectedFile.name === file.name &&
      selectedFile.size === file.size
    ) {
      onContentChange(null);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {showHeader && (
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "#F3F0FF", color: "#8B5CF6" }}
            >
              <FileText />
            </div>
          </div>
          <h1 className="mb-8 text-sm font-semibold">{heading}</h1>
        </div>
      )}

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
          <FileDropzone
            selectedFiles={selectedFile ? [selectedFile] : []}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={allowFileRemoval ? handleRemoveFile : undefined}
            allowedFileTypes={allowedFileTypes}
            maxFileSizeBytes={maxFileSizeBytes}
            emptyTitle={uploadDescription}
            showRemoveButton={allowFileRemoval}
            disabled={
              disableWhenHasSelection &&
              typeof content === "string" &&
              content.trim().length > 0
            }
          />
        </TabsContent>

        <TabsContent value="url" className="mt-6">
          <div className="rounded-lg border-2 border-gray-200 p-8">
            <Input
              type="url"
              className="w-full"
              placeholder={fileUrlPlaceholder}
              value={typeof content === "string" ? content : ""}
              onChange={(event) => onContentChange(event.target.value)}
              disabled={disableWhenHasSelection && selectedFile !== null}
            />
          </div>
        </TabsContent>
      </Tabs>

      {footer}
    </div>
  );
}
