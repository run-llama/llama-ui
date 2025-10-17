import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/base/button";
import { Input } from "@/base/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/base/dialog";
import { FileUpload } from "./inline-file-upload";
import { FileDropzone } from "./dropzone";
import type { FileUploaderProps } from "../types";
import { validateFile, type FileType } from "../utils/file-utils";
import { useFileUpload } from "../hooks/use-file-upload";
import { useUploadProgress } from "../hooks/use-upload-progress";
import { UploadProgress } from "./upload-progress";
import { logger } from "@shared/logger";

export function FileUploader({
  title,
  description,
  inputFields,
  allowedFileTypes = [] as FileType[],
  maxFileSizeBytes = 100 * 1024 * 1024, // 100MB default
  multiple = false,
  onSuccess,
  trigger,
  isProcessing = false,
}: FileUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fileUrl, setFileUrl] = useState("");

  // Dynamic title and description based on multiple setting
  const modalTitle = title || (multiple ? "Upload Files" : "Upload File");
  const modalDescription =
    description ||
    (multiple
      ? "Upload files and fill in the required information"
      : "Upload a file and fill in the required information");

  const uploadProgress = useUploadProgress();

  const { uploadAndReturn, uploadFromUrl } = useFileUpload({
    onUploadStart: uploadProgress.startUpload,
    onProgress: uploadProgress.updateProgress,
    onUploadComplete: uploadProgress.completeUpload,
    onUploadError: uploadProgress.failUpload,
  });

  const handleClose = () => {
    setIsOpen(false);
    setFieldValues({});
    setSelectedFiles([]);
    setFieldErrors({});
    setFileUrl("");
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));

    // Clear error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};

    inputFields?.forEach((field) => {
      const value = fieldValues[field.key] || "";

      if (field.required && !value.trim()) {
        errors[field.key] = `${field.label} is required`;
        return;
      }

      if (field.validation && value.trim()) {
        const validationError = field.validation(value.trim());
        if (validationError) {
          errors[field.key] = validationError;
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileSelect = (newFiles: File[]) => {
    const validFiles: File[] = [];
    // Remove toast usage, just skip invalid files
    newFiles.forEach((file) => {
      const validationError = validateFile(
        file,
        allowedFileTypes,
        maxFileSizeBytes
      );
      if (!validationError) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      if (multiple) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      } else {
        setSelectedFiles(validFiles.slice(0, 1)); // Only take the first file for single upload
      }
      setFileUrl("");
    }
  };

  const handleContentChange = (content: File | string | null) => {
    if (content instanceof File) {
      handleFileSelect([content]);
      return;
    }

    if (typeof content === "string") {
      setSelectedFiles([]);
      setFileUrl(content);
      return;
    }

    setSelectedFiles([]);
    setFileUrl("");
  };

  const handleUpload = async () => {
    const hasFiles = selectedFiles.length > 0;
    const trimmedUrl = fileUrl.trim();
    const currentFieldValues = { ...fieldValues };

    if (multiple) {
      if (!hasFiles) {
        return;
      }
    } else if (!hasFiles && trimmedUrl.length === 0) {
      return;
    }

    if (!validateFields()) {
      return;
    }

    const uploadFiles = async (files: File[]) => {
      handleClose();

      try {
        const results = await Promise.all(
          files.map((file) => uploadAndReturn(file))
        );
        const successfulData = results
          .filter((result) => result.success && result.data)
          .map((result) => result.data!);

        if (successfulData.length > 0) {
          await onSuccess(successfulData, currentFieldValues);
        }
      }  catch (error) {
        logger.error("FileUploader uploadFiles failed", {
          error,
          fileCount: files.length,
        });
      }
    };

    if (!multiple && trimmedUrl.length > 0 && !hasFiles) {
      handleClose();

      try {
        const result = await uploadFromUrl(trimmedUrl);
        if (result.success && result.data) {
          await onSuccess([result.data], {
            ...currentFieldValues,
            fileUrl: trimmedUrl,
          });
        }
      } catch (error) {
        logger.error("FileUploader uploadFromUrl failed", {
          error,
          url: trimmedUrl,
        });
      }
      return;
    }

    await uploadFiles(multiple ? selectedFiles : selectedFiles.slice(0, 1));
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const singleUploadContent = selectedFiles[0] ?? (fileUrl ? fileUrl : null);

  const canSubmit = () => {
    const requiredFieldsSatisfied =
      !inputFields ||
      inputFields.length === 0 ||
      inputFields.every(
        (field) =>
          !field.required ||
          (fieldValues[field.key] && fieldValues[field.key].trim())
      );

    if (!requiredFieldsSatisfied) {
      return false;
    }

    if (multiple) {
      return selectedFiles.length > 0;
    }

    return selectedFiles.length > 0 || fileUrl.trim().length > 0;
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="cursor-pointer" disabled={isProcessing}>
              {isProcessing && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              <Upload className="h-4 w-4" />
              {multiple ? "Upload Files" : "Upload File"}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <p className="text-sm text-muted-foreground">{modalDescription}</p>
          </DialogHeader>

          <div className="space-y-4 overflow-hidden">
            {/* Input Fields */}
            {inputFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </label>
                <Input
                  id={field.key}
                  value={fieldValues[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={fieldErrors[field.key] ? "border-destructive" : ""}
                />
                {fieldErrors[field.key] && (
                  <p className="text-sm text-destructive">
                    {fieldErrors[field.key]}
                  </p>
                )}
              </div>
            ))}

            {/* File Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {multiple ? "Files" : "File"}{" "}
                <span className="text-destructive ml-1">*</span>
              </label>
              {multiple ? (
                <FileDropzone
                  multiple
                  selectedFiles={selectedFiles}
                  onFilesSelected={handleFileSelect}
                  onRemoveFile={removeFile}
                  allowedFileTypes={allowedFileTypes}
                  maxFileSizeBytes={maxFileSizeBytes}
                  listFooter={
                    <div className="border-t border-muted-foreground/20 pt-2 text-xs text-muted-foreground">
                      Click to add more files or drag and drop
                    </div>
                  }
                />
              ) : (
                <FileUpload
                  className="mt-0"
                  heading={modalTitle}
                  content={singleUploadContent}
                  onContentChange={handleContentChange}
                  allowFileRemoval
                  showHeader={false}
                  allowedFileTypes={allowedFileTypes}
                  maxFileSizeBytes={maxFileSizeBytes}
                  disableWhenHasSelection
                  footer={null}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!canSubmit}>
              {selectedFiles.length > 1
                ? `Upload ${selectedFiles.length} Files & Process`
                : "Upload & Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadProgress
        files={uploadProgress.uploadProgressFiles}
        onClose={uploadProgress.clearAllUploads}
      />
    </>
  );
}
