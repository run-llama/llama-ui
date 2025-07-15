import * as React from "react";
import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

import { Button } from "../button";
import { Input } from "../input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../dialog";
import { validateFile, FileType } from "./file-utils";
import { useFileUpload, type FileUploadData } from "./use-file-upload";
import { useUploadProgress } from "./use-upload-progress";
import { UploadProgress } from "./upload-progress";

export interface InputField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
}

export interface FileUploaderProps {
  title?: string;
  description?: string;
  inputFields: InputField[];
  allowedFileTypes?: FileType[];
  maxFileSizeBytes?: number;
  multiple?: boolean;
  onSuccess: (
    data: FileUploadData[],
    fieldValues: Record<string, string>,
  ) => Promise<void>;
  trigger?: React.ReactNode;
  /** Set to true while processing the file after a callback, in order to show a spinner */
  isProcessing?: boolean;
}

export function FileUploader({
  title,
  description,
  inputFields,
  allowedFileTypes = [],
  maxFileSizeBytes = 100 * 1024 * 1024, // 100MB default
  multiple = false,
  onSuccess,
  trigger,
  isProcessing = false,
}: FileUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Dynamic title and description based on multiple setting
  const modalTitle = title || (multiple ? "Upload Files" : "Upload File");
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
  });

  const handleClose = () => {
    setIsOpen(false);
    setFieldValues({});
    setSelectedFiles([]);
    setDragActive(false);
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

    inputFields.forEach((field) => {
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
        maxFileSizeBytes,
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(Array.from(files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      // No toast, just return
      return;
    }

    if (!validateFields()) {
      // No toast, just return
      return;
    }

    // Close modal immediately when upload starts
    handleClose();

    try {
      // Upload all selected files and get results
      const uploadPromises = selectedFiles.map((file) => uploadAndReturn(file));
      const results = await Promise.all(uploadPromises);

      // Filter only successful uploads and extract their data
      const successfulData = results
        .filter((result) => result.success && result.data)
        .map((result) => result.data!);

      // Only call onSuccess if there are successful uploads
      if (successfulData.length > 0) {
        await onSuccess(successfulData, fieldValues);
      }
    } catch {
      // Error is already handled in the hook/progress panel
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const canSubmit =
    selectedFiles.length > 0 &&
    inputFields.every(
      (field) =>
        !field.required ||
        (fieldValues[field.key] && fieldValues[field.key].trim()),
    );

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

          <div className="space-y-4">
            {/* Input Fields */}
            {inputFields.map((field) => (
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
              <div
                className={`border border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/60"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                {selectedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Upload className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({Math.round(file.size / 1000)}KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {multiple && (
                      <div className="text-xs text-muted-foreground pt-2 mt-3 border-t border-muted-foreground/20">
                        Click to add more files or drag and drop
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                    <div>
                      <div className="text-sm font-medium">
                        Click to upload{multiple ? " files" : ""}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        or drag and drop
                      </div>
                    </div>
                    {allowedFileTypes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Supported: {allowedFileTypes.join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Max size: {Math.round(maxFileSizeBytes / 1000 / 1000)}MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="sr-only"
                  id="file-upload"
                  onChange={handleFileInputChange}
                  accept={allowedFileTypes.join(",")}
                  multiple={multiple}
                />
              </div>
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
