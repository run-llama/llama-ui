/**
 * WorkflowTrigger Component
 * A wrapper around FileUploader that creates workflow tasks after file upload
 */

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  FileUploader,
  type FileUploaderProps,
  type FileUploadData,
} from "../../file-upload";
import { useWorkflow } from "../hooks";
import { HandlerState } from "../store/handler";
import { JSONValue } from "../types";

export interface WorkflowTriggerProps
  extends Omit<FileUploaderProps, "onSuccess"> {
  workflowName: string;

  // support for custom workflow input
  customWorkflowInput?: (
    data: FileUploadData[],
    fieldValues: Record<string, string>
  ) => JSONValue;

  // Override onSuccess to provide workflow task result
  onSuccess?: (handler: HandlerState) => void;
  onError?: (error: Error) => void;
}

export function WorkflowTrigger({
  workflowName,
  customWorkflowInput,
  onSuccess,
  onError,
  title,
  description = "Upload files to start workflow processing",
  ...fileUploaderProps
}: WorkflowTriggerProps) {
  const { createHandler } = useWorkflow(workflowName);
  const [isCreating, setIsCreating] = useState(false);

  const handleFileUpload = useCallback(
    async (data: FileUploadData[], fieldValues: Record<string, string>) => {
      try {
        // Create workflow input from uploaded file and form fields
        const workflowInput = customWorkflowInput
          ? customWorkflowInput(data, fieldValues)
          : ({
              files: data.map((file) => ({
                fileId: file.fileId,
                url: file.url,
                name: file.file.name,
                type: file.file.type,
              })),
              ...fieldValues,
            } as JSONValue);

        // Create workflow task
        setIsCreating(true);
        const handler = await createHandler(workflowInput);
        onSuccess?.(handler);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        toast.error(`Failed to create workflow task: ${error.message}`);
        onError?.(error);
        throw error; // Re-throw to let FileUploader handle UI state
      } finally {
        setIsCreating(false);
      }
    },
    [createHandler, onSuccess, onError, customWorkflowInput]
  );

  return (
    <div>
      <FileUploader
        title={title}
        description={description}
        onSuccess={handleFileUpload}
        isProcessing={isCreating}
        {...fileUploaderProps}
      />
    </div>
  );
}
