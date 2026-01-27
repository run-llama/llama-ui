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
  maxFileSizeBytes,
  uploadTitle = "Drag files here to upload",
  uploadDescription,
  supportedFiles,
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
    <div className={cn("flex h-full w-full flex-col", className)}>
      {showHeader && (
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "#F3F0FF", color: "#8B5CF6" }}
            >
              <FileText />
            </div>
          </div>
          <h1 className="mb-4 text-sm font-semibold">{heading}</h1>
        </div>
      )}

      <Tabs defaultValue="upload" className="flex h-full flex-1 flex-col items-center">
        <TabsList>
          <TabsTrigger value="upload" label="Upload file" />
          <TabsTrigger value="url" label="File URL" />
          {onSelectFile && <TabsTrigger value="select" label="Select file" />}
        </TabsList>

        <TabsContent value="upload" className="mt-4 flex w-full flex-1 flex-col">
          <FileDropzone
            selectedFiles={selectedFile ? [selectedFile] : []}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={allowFileRemoval ? handleRemoveFile : undefined}
            allowedFileTypes={allowedFileTypes}
            maxFileSizeBytes={maxFileSizeBytes}
            title={uploadTitle}
            description={uploadDescription}
            supportedFiles={supportedFiles}
            showRemoveButton={allowFileRemoval}
            disabled={
              disableWhenHasSelection &&
              typeof content === "string" &&
              content.trim().length > 0
            }
          />
        </TabsContent>

        <TabsContent value="url" className="mt-4 flex w-full flex-1 flex-col">
          <div className="flex h-full min-h-[200px] flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-neutral-300 bg-white p-4">
            <div className="w-full max-w-md">
              <Input
                type="url"
                placeholder={fileUrlPlaceholder}
                value={typeof content === "string" ? content : ""}
                onChange={(event) => onContentChange(event.target.value)}
                disabled={disableWhenHasSelection && selectedFile !== null}
              />
            </div>
          </div>
        </TabsContent>

        {onSelectFile && (
          <TabsContent value="select" className="mt-4 flex w-full flex-1 flex-col">
            <div className="flex h-full min-h-[200px] flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <FolderOpen className="h-8 w-8 text-neutral-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
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
