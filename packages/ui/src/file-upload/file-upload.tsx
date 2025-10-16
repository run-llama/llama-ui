"use client";

import { Input } from "@/base/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/base/tabs";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { FileDropzone } from "./dropzone";

export interface FileUploadProps {
  className?: string;
  heading: string;
  content: File | string | null;
  onContentChange: (content: File | string | null) => void;
  allowFileRemoval?: boolean;
  showHeader?: boolean;
  allowedFileTypes?: string[];
  maxFileSizeMb?: number;
  uploadDescription?: string;
  uploadHelpText?: string;
  fileUrlPlaceholder?: string;
  disableWhenFileSelected?: boolean
  disableWhenUrlProvided?: boolean
  footer?: ReactNode;
}

const defaultFooter = (
  <div className="mt-6 rounded-md bg-gray-100 p-4 text-center text-xs text-gray-500">
    Supported file formats: PDF, TXT, CSV, JSON, XLS, XLSX, and{" "}
    <a
      href="https://developers.llamaindex.ai/python/cloud/llamaparse/features/supported_document_types/"
      className="underline"
      target="_blank"
      rel="noreferrer"
    >
      more
    </a>
  </div>
);

export function FileUpload({
  className,
  heading,
  content,
  onContentChange,
  allowFileRemoval = false,
  showHeader = true,
  allowedFileTypes = [],
  maxFileSizeMb,
  disableWhenFileSelected = false,
  disableWhenUrlProvided = false,
  uploadDescription = "Upload file (drag or click)",
  uploadHelpText,
  fileUrlPlaceholder = "Paste the file link here",
  footer = defaultFooter,
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
            maxSizeMb={maxFileSizeMb}
            emptyTitle={uploadDescription}
            emptyDescription={uploadHelpText}
            showRemoveButton={allowFileRemoval}
            disabled={disableWhenUrlProvided && typeof content === "string" && content.trim().length > 0}
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
              disabled={disableWhenFileSelected && selectedFile !== null}
            />
          </div>
        </TabsContent>
      </Tabs>

      {footer}
    </div>
  );
}
