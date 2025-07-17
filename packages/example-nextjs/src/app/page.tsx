"use client";

import { useState } from "react";
import {
  FileUploader,
  ExtractedDataDisplay,
  FilePreview,
  ItemGrid,
  ProcessingSteps,
  type WorkflowEvent,
  type FileUploadData,
} from "@llamaindex/ui";
import { FileType } from "@llamaindex/ui";

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Mock data for ExtractedDataDisplay
  const mockExtractedData = {
    vendor: "Acme Corporation",
    invoiceNumber: "INV-2024-001",
    totalAmount: 1250.0,
    date: "2024-01-15",
    items: [
      {
        description: "Labour Charges",
        amount: 1250.0,
      },
      {
        description: "Material Costs", 
        amount: 850.5,
      },
    ],
  };

  // Mock data for ProcessingSteps (correct format)
  const mockWorkflowEvents: WorkflowEvent[] = [
    {
      event_name: "FileReceived",
      label: "File Received",
      status: "completed",
      timestamp: "2024-01-15T10:00:00Z",
    },
    {
      event_name: "ProcessingDocument",
      label: "Processing Document",
      status: "current",
      timestamp: "2024-01-15T10:05:00Z",
    },
    {
      event_name: "ExtractingData",
      label: "Extracting Data",
      status: "pending",
    },
  ];

  const handleFileSuccess = async (
    fileData: FileUploadData[],
    fieldValues: Record<string, string>
  ) => {
    console.log("Files uploaded:", fileData, fieldValues);
    setUploadedFiles(fileData);
    if (fileData.length > 0) {
      // Use a demo file ID for preview
      setSelectedFileId("demo-file-id");
    }
  };

  const handleExtractedDataChange = (updatedData: Record<string, unknown>) => {
    console.log("Data changed:", updatedData);
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">LlamaIndex UI Components Demo</h1>
        <p className="text-gray-600">Testing all available components from @llamaindex/ui</p>
      </div>

      {/* File Uploader */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">File Uploader</h2>
        <FileUploader
          onSuccess={handleFileSuccess}
          inputFields={[
            { key: "project", label: "Project Name", required: true },
            { key: "category", label: "Category", required: false },
          ]}
          allowedFileTypes={[FileType.PDF, FileType.JPEG, FileType.PNG, FileType.TXT]}
          maxFileSizeBytes={10 * 1024 * 1024} // 10MB
          multiple
        />
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Uploaded Files:</h3>
            <ul className="space-y-1">
              {uploadedFiles.map((fileData, index) => (
                <li key={index} className="text-sm">
                  <span className="text-blue-600">
                    {fileData.file.name} ({(fileData.file.size / 1024).toFixed(1)} KB)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* File Preview */}
      {selectedFileId && (
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">File Preview</h2>
          <div className="max-w-4xl mx-auto h-96">
            <FilePreview
              fileId={selectedFileId}
            />
          </div>
        </section>
      )}

      {/* Extracted Data Display */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Extracted Data Display</h2>
        <ExtractedDataDisplay
          data={mockExtractedData}
          onChange={handleExtractedDataChange}
          confidence={{
            vendor: 0.95,
            invoiceNumber: 0.87,
            totalAmount: 0.92,
            date: 0.78,
          }}
        />
      </section>

      {/* Item Grid */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Item Grid</h2>
        <ItemGrid
          client={{} as any} // Mock client for demo
          builtInColumns={{
            fileName: true,
            status: true,
            createdAt: true,
            itemsToReview: true,
            actions: true,
          }}
          defaultPageSize={10}
          useMockData={true}
          onRowClick={(item) => {
            console.log("Row clicked:", item);
          }}
        />
      </section>

      {/* Processing Steps */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Processing Steps</h2>
        <ProcessingSteps
          workflowEvents={mockWorkflowEvents}
          title="Document Processing Workflow"
        />
      </section>
    </div>
  );
}
