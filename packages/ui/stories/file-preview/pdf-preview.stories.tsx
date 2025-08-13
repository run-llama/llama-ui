import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
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
    highlight: {
      control: "object",
      description:
        "Optional highlight: { page, x, y, width, height } in PDF page coordinates",
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

export const InteractiveHighlight: Story = {
  args: {
    url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  },
  render: (args) => <InteractiveHighlightExample url={args.url} />,
};

function InteractiveHighlightExample({ url }: { url: string }) {
  const [highlight, setHighlight] = useState({
    page: 1,
    x: 50,
    y: 350,
    width: 250,
    height: 140,
  });

  const goToFirstPage = () => {
    setHighlight({ page: 1, x: 200, y: 205, width: 200, height: 80 });
  };

  const randomizeArea = () =>
    setHighlight((prev) => ({
      ...prev,
      page: Math.floor(Math.random() * 5) + 1,
      x: 50,
      y: Math.max(10, Math.floor(Math.random() * 500)),
      width: 250,
      height: 250,
    }));

  return (
    <div className="h-screen flex">
      <div className="w-64 p-4 border-r space-y-2">
        <div className="font-medium mb-2">Controls</div>
        <button
          className="px-2 py-1 border rounded w-full"
          onClick={goToFirstPage}
        >
          Scroll to page 1 with highlight
        </button>
        <button
          className="px-2 py-1 border rounded w-full"
          onClick={randomizeArea}
        >
          Randomize Area
        </button>
      </div>
      <div className="flex-1">
        <PdfPreview url={url} highlight={highlight} />
      </div>
    </div>
  );
}
