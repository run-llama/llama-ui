import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/base/button";
import { Input } from "@/base/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Label } from "@/base/label";

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
  disabled = false,
  onSelectFile,
  selectFileLabel,
  selectFileDescription,
  hashingOptions,
}: FileUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Dynamic title and description based on multiple setting
  const titleOrDefault = title || (multiple ? "Upload Files" : "Upload File");
  const modalDescription =
    description ||
    (multiple
      ? "Upload files and fill in the required information"
      : "Upload a file and fill in the required information");

  const uploadProgress = useUploadProgress();

  const { uploadAndReturn } = useFileUpload({
    onUploadStart: uploadProgress.startUpload,
    onProgress: uploadProgress.updateProgress,
    onUploadComplete: uploadProgress.completeUpload,
    onUploadError: uploadProgress.failUpload,
    hashingOptions,
  });

  const handleClose = () => {
    setIsOpen(false);
    setFieldValues({});
    setSelectedFiles([]);
    setFieldErrors({});
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
    }
  };

  const handleContentChange = (content: File | null) => {
    if (content) {
      handleFileSelect([content]);
    } else {
      setSelectedFiles([]);
    }
  };

  const handleUpload = async () => {
    const hasFiles = selectedFiles.length > 0;
    const currentFieldValues = { ...fieldValues };

    if (!hasFiles) {
      return;
    }

    if (!validateFields()) {
      return;
    }

    handleClose();

    try {
      const results = await Promise.all(
        (multiple ? selectedFiles : selectedFiles.slice(0, 1)).map((file) =>
          uploadAndReturn(file)
        )
      );
      const successfulData = results
        .filter((result) => result.success && result.data)
        .map((result) => result.data!);

      if (successfulData.length > 0) {
        await onSuccess(successfulData, currentFieldValues);
      }
    } catch (error) {
      logger.error("FileUploader uploadFiles failed", {
        error,
        fileCount: selectedFiles.length,
      });
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const singleUploadContent = selectedFiles[0] ?? null;

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

    return selectedFiles.length > 0;
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button
              disabled={disabled}
              startIcon={<Upload className="h-4 w-4" />}
              label={titleOrDefault}
              isLoading={isProcessing}
              onClick={() => setIsOpen(true)}
            />
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader title={titleOrDefault} description={modalDescription} />

          <div className="space-y-4">
            {/* Input Fields */}
            {inputFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label
                  htmlFor={field.key}
                  label={field.label}
                  required={field.required}
                />
                <Input
                  id={field.key}
                  value={fieldValues[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  variant={fieldErrors[field.key] ? "error" : "default"}
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
              <Label
                htmlFor={multiple ? "files" : "file"}
                label={multiple ? "Files" : "File"}
                required
              />
              {multiple ? (
                <FileDropzone
                  multiple
                  selectedFiles={selectedFiles}
                  onFilesSelected={handleFileSelect}
                  onRemoveFile={removeFile}
                  allowedFileTypes={allowedFileTypes}
                />
              ) : (
                <FileUpload
                  heading={titleOrDefault}
                  content={singleUploadContent}
                  onContentChange={handleContentChange}
                  allowFileRemoval
                  showHeader={false}
                  allowedFileTypes={allowedFileTypes}
                  footer={null}
                  onSelectFile={onSelectFile}
                  selectFileLabel={selectFileLabel}
                  selectFileDescription={selectFileDescription}
                />
              )}
            </div>
          </div>

          <DialogFooter
            secondary={{ label: "Cancel", onClick: handleClose }}
            primary={{
              label:
                selectedFiles.length > 1
                  ? `Upload ${selectedFiles.length} Files & Process`
                  : "Upload & Process",
              onClick: handleUpload,
              disabled: !canSubmit(),
            }}
          />
        </DialogContent>
      </Dialog>

      <UploadProgress
        files={uploadProgress.uploadProgressFiles}
        onClose={uploadProgress.clearAllUploads}
      />
    </>
  );
}
