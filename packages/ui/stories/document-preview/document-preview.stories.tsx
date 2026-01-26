import type { Meta, StoryObj } from "@storybook/react";
import { type FC, useState } from "react";
import {
  DocumentPreview,
  type DocumentPreviewMultiProps,
  type UploadableItem,
} from "../../src/document-preview/document-preview";

const meta: Meta<typeof DocumentPreview> = {
  title: "Components/DocumentPreview/Upload",
  component: DocumentPreview,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onChange: { action: "content changed" },
    onRemove: { action: "removed" },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: "100vh",
          width: "100%",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DocumentPreview>;

type StoryArgs = Story["args"];

const UploadStateContainer: FC<StoryArgs> = (props = {}) => {
  const { onChange, onRemove, allowMultiple, value, ...rest } =
    props as DocumentPreviewMultiProps;
  const [localValue, setLocalValue] = useState<UploadableItem[]>(
    Array.isArray(value) ? [...value] : []
  );

  const handleRemove: DocumentPreviewMultiProps["onRemove"] = (
    index: number
  ) => {
    setLocalValue((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    onRemove?.(index);
  };

  const handleChange: DocumentPreviewMultiProps["onChange"] = (next) => {
    setLocalValue(next);
    onChange?.(next);
  };

  if (!allowMultiple) {
    return <p>UploadStateContainer requires allowMultiple to be true.</p>;
  }

  return (
    <DocumentPreview
      {...(rest as DocumentPreviewMultiProps)}
      allowMultiple
      value={localValue}
      onChange={handleChange}
      onRemove={handleRemove}
    />
  );
};

export const UploadState: Story = {
  args: {
    heading: "Upload a document",
    allowMultiple: true,
    value: [],
    title: "Drag files here to upload",
    description: "Up to 20 files, 315 MB total",
    showSupportedFiles: true,
    supportedFiles:
      "Supported file formats: Documents (e.g. PDF, DOCX, WPS), Slides (e.g. PPTX, Keynote), Spreadsheets (e.g. XLSX, CSV), Images (e.g. PNG, JPG, TIFF) and more.",
  },
  render: (args) => <UploadStateContainer {...args} />,
};

export const MultipleFiles: Story = {
  name: "Multiple Files",
  args: {
    allowMultiple: true,
    value: [
      {
        fileName: "diagram.png",
        content: "/image.png",
      },
      {
        fileName: "tracemonkey-pldi-09.pdf",
        content:
          "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
      },
    ],
  },
  render: (args) => <UploadStateContainer {...args} />,
};

export const PdfOnly: Story = {
  name: "PDF Files Only",
  args: {
    heading: "Upload a PDF file",
    allowMultiple: true,
    value: [],
    accept: {
      "application/pdf": [".pdf"],
    },
  },
  render: (args) => <UploadStateContainer {...args} />,
};

export const WithSelectFile: Story = {
  name: "With Select File Tab",
  args: {
    heading: "Upload or select a document",
    allowMultiple: true,
    value: [],
    onSelectFile: () => {
      alert("Select file button was clicked!");
    },
    selectFileLabel: "Browse files",
    selectFileDescription: "Choose a file from your existing documents",
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg mx-4 mt-4">
        <p className="text-blue-700 text-sm">
          <strong>Note:</strong> This story demonstrates the &quot;Select
          file&quot; tab. Click the button in the &quot;Select file&quot; tab to
          see the callback in action.
        </p>
      </div>
      <UploadStateContainer {...args} />
    </div>
  ),
};

export const FileSystemDirectory: Story = {
  name: "File System - Directory",
  args: {
    allowMultiple: true,
    value: [
      {
        content: "directory_id://dir-xyz789ghi012",
        fileName: "Project Documents",
        id: "dir-002",
      },
    ],
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 rounded-lg mx-4 mt-4">
        <p className="text-amber-700 text-sm">
          <strong>Note:</strong> A single directory selected from the file
          system displays as a centered placeholder with a folder icon.
        </p>
      </div>
      <UploadStateContainer {...args} />
    </div>
  ),
};

export const FileSystemMultipleFiles: Story = {
  name: "File System - Multiple Files",
  args: {
    allowMultiple: true,
    value: [
      {
        content: "file_id://file-abc123def456",
        fileName: "quarterly-report.pdf",
        id: "dfl-001",
      },
      {
        content: "file_id://file-ghi789jkl012",
        fileName: "financial-summary.xlsx",
        id: "dfl-002",
      },
      {
        content: "file_id://file-mno345pqr678",
        fileName: "meeting-notes.docx",
        id: "dfl-003",
      },
      {
        content: "file_id://file-stu901vwx234",
        fileName: "product-roadmap.pdf",
        id: "dfl-004",
      },
    ],
    onSelectFile: (selectedFileIds: string[]) => {
      console.log("Already selected file IDs:", selectedFileIds);
      alert(
        `Add files clicked!\n\nAlready selected (${selectedFileIds.length} files):\n${selectedFileIds.join("\n")}\n\nUse these IDs to filter out duplicates in your file picker.`
      );
    },
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 rounded-lg mx-4 mt-4">
        <p className="text-amber-700 text-sm">
          <strong>Note:</strong> The &quot;Add files&quot; button passes
          currently selected file IDs to the callback, allowing you to filter
          out duplicates in your file picker.
        </p>
      </div>
      <UploadStateContainer {...args} />
    </div>
  ),
};
