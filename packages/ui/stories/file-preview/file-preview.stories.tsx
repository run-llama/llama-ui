import { Input } from "@/src";
import { URLFilePreview } from "@/src/file-preview/url-file-preview";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta: Meta<typeof URLFilePreview> = {
  title: "Components/FilePreview/FilePreviewV2",
  component: URLFilePreview,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fileData: {
      url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
      name: "sample.pdf",
    },
  },
  render: (args) => (
    <div className="h-screen">
      <URLFilePreview {...args} />
    </div>
  ),
};

export const Image: Story = {
  args: {
    fileData: {
      url: "https://placehold.co/600x400/FFF/31343C",
      name: "placeholder.jpg",
    },
  },
  render: (args) => (
    <div className="h-screen">
      <URLFilePreview {...args} />
    </div>
  ),
};

export const Upload: Story = {
  render: () => <UploadExample />,
};

function UploadExample() {
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]!;
    const url = URL.createObjectURL(file);
    setFile({ url, name: file.name });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Upload Section */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Upload & Preview</h2>
        <Input
          type="file"
          onChange={handleFileChange}
          data-testid="pdf-file-input"
        />
      </div>

      {/* File Preview Section */}
      <div className="flex-1 min-h-0" data-testid="pdf-preview-container">
        {file && <URLFilePreview fileData={file} />}
      </div>
    </div>
  );
}
