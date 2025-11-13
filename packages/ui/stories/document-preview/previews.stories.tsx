import type { Meta, StoryObj } from "@storybook/react";
import { DocumentPreview } from "../../src/document-preview/document-preview";

const SAMPLE_PDF_DATA_URL =
  "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQ0XSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQgL0YxIDI0IFRmIDcyIDcyIFRkIChIZWxsbyBTdG9yeWJvb2spIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL05hbWUgL0YxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE3IDAwMDAwIG4gCjAwMDAwMDAyMzAgMDAwMDAgbiAKMDAwMDAwMDM1MSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQyMQolJUVPRgo=";

const SAMPLE_IMAGE_URL = "/image.png";

const SAMPLE_CSV_DATA_URL =
  "data:text/csv;base64,Y29sdW1uMSxjb2x1bW4yCnZhbHVlMSx2YWx1ZTI=";

const SAMPLE_TEXT_DATA_URL =
  "data:text/plain;base64,SGVsbG8gV29ybGQhClRoaXMgaXMgYSBzYW1wbGUgdGV4dCBmaWxlLgpJdCBjb250YWlucyBtdWx0aXBsZSBsaW5lcyBvZiB0ZXh0Lg==";

const SAMPLE_MARKDOWN_DATA_URL =
  "data:text/markdown;base64,IyBIZWxsbyBXb3JsZAoKVGhpcyBpcyBhICoqbWFya2Rvd24qKiBmaWxlLgoKLSBJdGVtIDEKLSBJdGVtIDIKLSBJdGVtIDM=";

const SAMPLE_JSON_DATA_URL =
  "data:application/json;base64,ewogICJuYW1lIjogIkpvaG4gRG9lIiwKICAiYWdlIjogMzAsCiAgImNpdHkiOiAiTmV3IFlvcmsiCn0=";

const SAMPLE_DOCX_DATA_URL =
  "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAIAF";

const meta: Meta<typeof DocumentPreview> = {
  title: "Components/DocumentPreview/Previews",
  component: DocumentPreview,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
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

export const TextPreview: Story = {
  name: "Text Preview",
  args: {
    value: SAMPLE_TEXT_DATA_URL,
    fileName: "sample.txt",
  },
};

export const MarkdownPreview: Story = {
  name: "Markdown Preview",
  args: {
    value: SAMPLE_MARKDOWN_DATA_URL,
    fileName: "readme.md",
  },
};

export const JsonPreview: Story = {
  name: "JSON Preview",
  args: {
    value: SAMPLE_JSON_DATA_URL,
    fileName: "data.json",
  },
};

export const FileObjectPreview: Story = {
  name: "File Object Preview",
  args: {
    value: SAMPLE_IMAGE_URL,
    fileName: "image.jpg",
  },
};

export const UnsupportedPreview: Story = {
  name: "Unsupported Preview",
  args: {
    value: SAMPLE_DOCX_DATA_URL,
    fileName: "document.docx",
  },
};
