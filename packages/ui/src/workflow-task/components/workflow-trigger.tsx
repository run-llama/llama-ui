/**
 * WorkflowTrigger Component
 * Based on workflow-task-suite.md specifications
 * A wrapper around FileUploader that creates workflow tasks after file upload
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { FileUploader, type FileUploaderProps } from '../../file-uploader';
import { useWorkflowTaskCreate } from '../hooks/use-workflow-task-create';
import type { FileUploadData } from '../../file-uploader/use-file-upload';
import { WorkflowTaskSummary } from '../types';

export interface WorkflowTriggerProps extends Omit<FileUploaderProps, 'onSuccess'> {
  deployment: string;
  workflow?: string;

  // support for custom workflow input
  customWorkflowInput?: (data: FileUploadData[], fieldValues: Record<string, string>) => Record<string, unknown>;
  
  // Override onSuccess to provide workflow task result
  onSuccess?: (task: WorkflowTaskSummary) => void;
  onError?: (error: Error) => void;
}

export function WorkflowTrigger({ 
  deployment, 
  workflow,
  customWorkflowInput,
  onSuccess,
  onError,
  title = "Trigger Workflow",
  description = "Upload files to start workflow processing",
  ...fileUploaderProps
}: WorkflowTriggerProps) {
  const { createTask, isCreating, error } = useWorkflowTaskCreate();

  const handleFileUpload = useCallback(async (
    data: FileUploadData[],
    fieldValues: Record<string, string>
  ) => {
    try {
      // If customWorkflowInput is provided, use it to create the workflow input
      if (customWorkflowInput) {
        const workflowInput = customWorkflowInput(data, fieldValues);
        const task = await createTask(deployment, JSON.stringify(workflowInput), workflow);
        toast.success("Workflow task created successfully!");
        onSuccess?.(task);
        return;
      }

      // Create workflow input from uploaded file and form fields
      const workflowInput = {
        files: data.map(file => ({
          fileId: file.fileId,
          url: file.url,
          name: file.file.name,
          type: file.file.type
        })),
        ...fieldValues
      };

      // Create workflow task
      const task = await createTask(
        deployment, 
        JSON.stringify(workflowInput), 
        workflow
      );

      toast.success("Workflow task created successfully!");
      onSuccess?.(task);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(`Failed to create workflow task: ${error.message}`);
      onError?.(error);
      throw error; // Re-throw to let FileUploader handle UI state
    }
  }, [deployment, workflow, createTask, onSuccess, onError, customWorkflowInput]);

  return (
    <div>
      <FileUploader
        title={title}
        description={description}
        onSuccess={handleFileUpload}
        isProcessing={isCreating}
        {...fileUploaderProps}
      />
      
      {error && (
        <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          <strong>Error:</strong> {error.message}
        </div>
      )}
    </div>
  );
}