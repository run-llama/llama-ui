import type { Meta, StoryObj } from "@storybook/react";
import { type FC, useState } from "react";
import {
  DocumentPreview,
  type DocumentPreviewMultiProps,
  type UploadableItem,
} from "../../src/document-preview/document-preview";

const SAMPLE_PDF_DATA_URL =
  "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQ0XSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQgL0YxIDI0IFRmIDcyIDcyIFRkIChIZWxsbyBTdG9yeWJvb2spIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL05hbWUgL0YxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE3IDAwMDAwIG4gCjAwMDAwMDAyMzAgMDAwMDAgbiAKMDAwMDAwMDM1MSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQyMQolJUVPRgo=";

const SAMPLE_IMAGE_URL = "/image.png";

const SAMPLE_CSV_DATA_URL =
  "data:text/csv;base64,Y29sdW1uMSxjb2x1bW4yCnZhbHVlMSx2YWx1ZTI=";

const meta: Meta<typeof DocumentPreview> = {
  title: "Components/DocumentPreview",
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

export const PdfPreviewExample: Story = {
  name: "PDF Preview",
  args: {
    value: SAMPLE_PDF_DATA_URL,
    fileName: "sample.pdf",
    highlights: [
      {
        page: 1,
        x: 0.2,
        y: 0.2,
        width: 0.5,
        height: 0.1,
      },
    ],
  },
};

export const ImagePreview: Story = {
  args: {
    value: SAMPLE_IMAGE_URL,
    fileName: "diagram.png",
  },
};

export const SheetPreview: Story = {
  name: "Sheet Preview",
  args: {
    value: SAMPLE_CSV_DATA_URL,
    fileName: "dataset.csv",
  },
};

export const MultipleFiles: Story = {
  name: "Multiple Files",
  args: {
    allowMultiple: true,
    value: [
      {
        fileName: "diagram.png",
        content: SAMPLE_IMAGE_URL,
      },
      {
        fileName: "sample.pdf",
        content: SAMPLE_PDF_DATA_URL,
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
