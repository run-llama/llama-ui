"use client";

import { Input } from "@/base/input";
import { Button } from "@/base/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/base/tabs";
import { cn } from "@/lib/utils";
import { FileText, FolderOpen } from "lucide-react";

import { FileDropzone } from "./dropzone";
import type { FileUploadProps } from "../types";

export function FileUpload({
  className,
  heading,
  content,
  onContentChange,
  allowFileRemoval = false,
  showHeader = true,
  allowedFileTypes = [],
  uploadDescription = "Upload file (drag or click)",
  fileUrlPlaceholder = "Paste the file link here",
  disableWhenHasSelection = false,
  footer,
  onSelectFile,
  selectFileLabel = "Select file",
  selectFileDescription = "Choose a file from your existing files",
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
        <TabsList
          className={cn(
            "grid w-full rounded-none border-b border-gray-200 bg-transparent p-0",
            onSelectFile ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          <TabsTrigger value="upload" label="Upload file" />
          <TabsTrigger value="url" label="File URL" />
          {onSelectFile && <TabsTrigger value="select" label="Select file" />}
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <FileDropzone
            selectedFiles={selectedFile ? [selectedFile] : []}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={allowFileRemoval ? handleRemoveFile : undefined}
            allowedFileTypes={allowedFileTypes}
            title={uploadDescription}
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
              placeholder={fileUrlPlaceholder}
              value={typeof content === "string" ? content : ""}
              onChange={(event) => onContentChange(event.target.value)}
              disabled={disableWhenHasSelection && selectedFile !== null}
            />
          </div>
        </TabsContent>

        {onSelectFile && (
          <TabsContent value="select" className="mt-6">
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FolderOpen className="h-8 w-8 text-gray-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-600">
                  {selectFileDescription}
                </p>
              </div>
              <div className="mt-2">
                <Button
                  variant="default"
                  onClick={onSelectFile}
                  label={selectFileLabel}
                />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {footer}
    </div>
  );
}
