/**
 * WorkflowTrigger Component
 * A wrapper around FileUploader that creates workflow tasks after file upload
 */

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { FileUploader, type FileUploaderProps } from "../../file-uploader";
import { useWorkflowCreate } from "../hooks/use-workflow-create";
import type { FileUploadData } from "../../file-uploader/use-file-upload";
import { JSONValue, WorkflowHandlerSummary } from "../types";

export interface WorkflowTriggerProps
  extends Omit<FileUploaderProps, "onSuccess"> {
  workflowName: string;

  // support for custom workflow input
  customWorkflowInput?: (
    data: FileUploadData[],
    fieldValues: Record<string, string>
  ) => JSONValue;

  // Override onSuccess to provide workflow task result
  onSuccess?: (handler: WorkflowHandlerSummary) => void;
  onError?: (error: Error) => void;
}

export function WorkflowTrigger({
  workflowName,
  customWorkflowInput,
  onSuccess,
  onError,
  title = "Trigger Workflow",
  description = "Upload files to start workflow processing",
  ...fileUploaderProps
}: WorkflowTriggerProps) {
  const { runWorkflow: createRun, isCreating, error } = useWorkflowCreate();

  useEffect(() => {
    if (error) {
      toast.error(`Failed to create workflow handler: ${error.message}`);
    }
  }, [error]);

  const handleFileUpload = useCallback(
    async (data: FileUploadData[], fieldValues: Record<string, string>) => {
      try {
        // If customWorkflowInput is provided, use it to create the workflow input
        if (customWorkflowInput) {
          const workflowInput = customWorkflowInput(data, fieldValues);
          const task = await createRun(workflowName, workflowInput);
          toast.success("Workflow task created successfully!");
          onSuccess?.(task);
          return;
        }

        // Create workflow input from uploaded file and form fields
        const workflowInput = {
          files: data.map((file) => ({
            fileId: file.fileId,
            url: file.url,
            name: file.file.name,
            type: file.file.type,
          })),
          ...fieldValues,
        } as JSONValue;

        // Create workflow task
        const task = await createRun(workflowName, workflowInput);

        toast.success("Workflow task created successfully!");
        onSuccess?.(task);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        toast.error(`Failed to create workflow task: ${error.message}`);
        onError?.(error);
        throw error; // Re-throw to let FileUploader handle UI state
      }
    },
    [workflowName, createRun, onSuccess, onError, customWorkflowInput]
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
