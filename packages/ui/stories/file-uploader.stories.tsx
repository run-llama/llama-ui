import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import { FileUploader, type FileUploadData } from "../src/file-uploader";
import { FileType, FILE_TYPE_GROUPS } from "../src/file-uploader/file-utils";

const meta: Meta<typeof FileUploader> = {
  title: "Components/FileUploader",
  component: FileUploader,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof FileUploader>;

export const Basic: Story = {
  args: {
    inputFields: [{ key: "partNumber", label: "Part Number", required: true }],
    allowedFileTypes: [FileType.PDF, FileType.JPEG, FileType.PNG],
    maxFileSizeBytes: 10 * 1000 * 1000, // 10MB
  },
  render: function Render(args) {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSuccess = async (
      fileData: FileUploadData[],
      fieldValues: Record<string, string>,
    ) => {
      console.log("Submitted:", { fileData, fieldValues });
      await args.onSuccess?.(fileData, fieldValues);
      setIsSubmitted(true);
    };

    return (
      <div className="space-y-4">
        <FileUploader {...args} onSuccess={handleSuccess} />
        {isSubmitted && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-700">File uploaded successfully!</p>
          </div>
        )}
      </div>
    );
  },
};

export const MultipleFiles: Story = {
  args: {
    title: "Upload Multiple Files",
    description:
      "Select multiple files and see batch upload progress with queue management!",
    inputFields: [
      { key: "project", label: "Project Name", required: true },
      { key: "category", label: "Category", required: false },
    ],
    multiple: true,
    allowedFileTypes: [
      ...FILE_TYPE_GROUPS.DOCUMENTS,
      ...FILE_TYPE_GROUPS.IMAGES,
    ],
    maxFileSizeBytes: 50 * 1000 * 1000, // 50MB
    onSuccess: async (fileData, fieldValues) => {
      // fileData is now FileUploadData[] (only successful uploads)
      const successFiles = fileData.map((data) => data.file.name);
      console.log(
        "Batch upload results:",
        { successFiles, successCount: successFiles.length },
        "with data:",
        fieldValues,
      );
      // Simulate variable processing time
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 5000 + 1000),
      );
    },
  },
  render: function Render(args) {
    const [submissions, setSubmissions] = useState<string[]>([]);

    const handleSuccess = async (
      fileData: FileUploadData[],
      fieldValues: Record<string, string>,
    ) => {
      // fileData is now FileUploadData[] (only successful uploads)
      const successFiles = fileData.map((data) => data.file.name);
      console.log("Files submitted:", successFiles, fieldValues);
      setSubmissions((prev) => [...prev, ...successFiles]);
      await args.onSuccess?.(fileData, fieldValues);
    };

    return (
      <div className="space-y-4">
        <FileUploader {...args} onSuccess={handleSuccess} />
        {submissions.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-700 mb-2">
              Successfully uploaded files:
            </h3>
            <ul className="text-green-600 text-sm">
              {submissions.map((fileName, index) => (
                <li key={index}>✓ {fileName}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

// Story to test error scenarios
export const WithAPIErrors: StoryObj<typeof FileUploader> = {
  args: {
    title: "Upload Files - Error Testing",
    description: "Test API error handling with MSW",
    inputFields: [{ key: "project", label: "Project Name", required: true }],
    multiple: true,
    allowedFileTypes: [
      FileType.PDF,
      FileType.DOC,
      FileType.DOCX,
      FileType.TXT,
      FileType.JPG,
      FileType.PNG,
      FileType.JPEG,
    ],
    maxFileSizeBytes: 50 * 1000 * 1000, // 50MB
  },
  parameters: {
    msw: {
      handlers: {
        // Override only the upload endpoint for error testing
        upload: http.post("https://api.cloud.llamaindex.ai/api/v1/files", async ({ request }) => {
          const formData = await request.formData();
          const file = formData.get("upload_file") as File;

          if (!file) {
            return new HttpResponse("No file provided", { status: 400 });
          }

          // Simulate processing delay
          await new Promise((resolve) =>
            setTimeout(resolve, 500 + Math.random() * 1000),
          );

          // Randomly fail some uploads to test error handling
          if (Math.random() < 0.3) {
            return new HttpResponse("Upload service temporarily unavailable", {
              status: 503,
            });
          }

          const fileId = `error-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

          return HttpResponse.json({
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            status: "uploaded",
          });
        }),
      },
    },
  },
  render: function Render(args) {
    const [successfulUploads, setSuccessfulUploads] = useState<string[]>([]);

    const handleSuccess = async (
      fileData: FileUploadData[],
      fieldValues: Record<string, string>,
    ) => {
      // fileData contains only successful uploads
      const successFiles = fileData.map((data) => data.file.name);
      console.log(
        "Error Test - Successful uploads:",
        { successFiles },
        fieldValues,
      );

      setSuccessfulUploads((prev) => [...prev, ...successFiles]);
    };

    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700 text-sm">
            <strong>Note:</strong> This story randomly fails ~30% of uploads to
            test error handling. Try uploading multiple files to see both
            success and failure cases. Failed uploads are shown in the progress
            panel.
          </p>
        </div>

        <FileUploader {...args} onSuccess={handleSuccess} />

        {successfulUploads.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-700 mb-2">
              ✅ Successful Uploads (processed by onSuccess):
            </h3>
            <ul className="text-green-600 text-sm">
              {successfulUploads.map((fileName, index) => (
                <li key={index}>• {fileName}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};
