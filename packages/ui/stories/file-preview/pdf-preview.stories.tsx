import type { Meta, StoryObj } from "@storybook/react-vite";
import { PdfPreview } from "../../src/file-preview/pdf-preview";

const meta: Meta<typeof PdfPreview> = {
  title: "Components/FilePreview/PdfPreview",
  component: PdfPreview,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    url: {
      control: "text",
      description: "URL of the PDF file to preview",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  },
  render: (args) => (
    <div className="h-screen">
      <PdfPreview {...args} />
    </div>
  ),
};
