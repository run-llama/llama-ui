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
