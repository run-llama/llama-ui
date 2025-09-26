import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "@storybook/test";
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
    fileName: {
      control: "text",
      description: "Custom filename to display in the toolbar",
    },
    toolbarClassName: {
      control: "text",
      description: "Custom CSS classes for the toolbar styling",
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

export const WithFileName: Story = {
  args: {
    url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    fileName: "TraceMonkey Research Paper",
  },
  render: (args) => (
    <div className="h-screen">
      <PdfPreview {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for PDF to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check that custom filename is displayed in toolbar
    expect(canvas.getByText("TraceMonkey Research Paper")).toBeInTheDocument();
  },
};

export const CustomToolbar: Story = {
  args: {
    url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    fileName: "Styled Toolbar PDF",
    toolbarClassName: "text-gray-500",
  },
  render: (args) => (
    <div className="h-screen">
      <PdfPreview {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for PDF to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check that custom filename is displayed
    expect(canvas.getByText("Styled Toolbar PDF")).toBeInTheDocument();

    // Check that toolbar has custom styling applied
    const toolbar = canvas.getByText("Styled Toolbar PDF").closest("div.sticky");
    expect(toolbar).toHaveClass("text-gray-500");
  },
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

// Interactive Test Component similar to DataUpdateTestsComponent
function PdfHighlightTestsComponent() {
  const url =
    "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

  const [highlight, setHighlight] = useState({
    page: 1,
    x: 100,
    y: 200,
    width: 300,
    height: 100,
  });

  const [testLog, setTestLog] = useState<string[]>([]);
  const [updateCount, setUpdateCount] = useState(0);

  const addLog = (message: string) => {
    setTestLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const updateHighlight = (newHighlight: typeof highlight) => {
    setHighlight(newHighlight);
    setUpdateCount((prev) => prev + 1);
    addLog(
      `Highlight updated: Page ${newHighlight.page}, Position (${newHighlight.x}, ${newHighlight.y}), Size ${newHighlight.width}x${newHighlight.height}`
    );
  };

  // Test actions
  const goToPage2 = () => {
    updateHighlight({ page: 2, x: 150, y: 300, width: 200, height: 80 });
  };

  const goToPage3 = () => {
    updateHighlight({ page: 3, x: 80, y: 150, width: 350, height: 120 });
  };

  const createSmallHighlight = () => {
    updateHighlight({ page: 1, x: 200, y: 100, width: 100, height: 50 });
  };

  const createLargeHighlight = () => {
    updateHighlight({ page: 1, x: 50, y: 250, width: 400, height: 200 });
  };

  const clearHighlight = () => {
    setHighlight({ page: 1, x: 0, y: 0, width: 0, height: 0 });
    setUpdateCount((prev) => prev + 1);
    addLog("Highlight cleared");
  };

  const resetHighlight = () => {
    updateHighlight({ page: 1, x: 100, y: 200, width: 300, height: 100 });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left panel: Controls and test info */}
      <div
        style={{
          width: "320px",
          padding: "16px",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
            }}
          >
            PDF Highlight Interactive Tests
          </h3>
          <div
            data-testid="update-counter"
            style={{ fontSize: "12px", color: "#666" }}
          >
            Updates: {updateCount}
          </div>
        </div>

        {/* Current highlight info */}
        <div
          style={{
            marginBottom: "16px",
            padding: "8px",
            background: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Current Highlight:
          </div>
          <div
            data-testid="current-highlight"
            style={{ fontSize: "11px", fontFamily: "monospace" }}
          >
            Page: {highlight.page}
            <br />
            Position: ({highlight.x}, {highlight.y})<br />
            Size: {highlight.width} × {highlight.height}
          </div>
        </div>

        {/* Test controls */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Navigation Tests:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              data-testid="go-to-page-2"
              onClick={goToPage2}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Go to Page 2
            </button>
            <button
              data-testid="go-to-page-3"
              onClick={goToPage3}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Go to Page 3
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Size Tests:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              data-testid="small-highlight"
              onClick={createSmallHighlight}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Small Highlight
            </button>
            <button
              data-testid="large-highlight"
              onClick={createLargeHighlight}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Large Highlight
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            State Tests:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              data-testid="clear-highlight"
              onClick={clearHighlight}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Clear Highlight
            </button>
            <button
              data-testid="reset-highlight"
              onClick={resetHighlight}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Test log */}
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Test Log:
          </div>
          <div
            data-testid="test-log"
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              padding: "8px",
              background: "#f9f9f9",
              borderRadius: "4px",
              fontSize: "10px",
              fontFamily: "monospace",
            }}
          >
            {testLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: PDF Preview */}
      <div style={{ flex: 1 }}>
        <PdfPreview
          url={url}
          highlight={highlight.width > 0 ? highlight : undefined}
        />
      </div>
    </div>
  );
}

export const HighlightInteractiveTests: Story = {
  render: () => <PdfHighlightTestsComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Helper to wait for updates
    const waitForUpdate = async (expectedCount: number, timeout = 2000) => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        try {
          const counter = canvas.getByTestId("update-counter");
          if (counter.textContent?.includes(`Updates: ${expectedCount}`)) {
            return;
          }
        } catch {
          // Element not found yet, continue waiting
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      // Final check with expect for proper error reporting
      expect(canvas.getByTestId("update-counter")).toHaveTextContent(
        `Updates: ${expectedCount}`
      );
    };

    // Wait for PDF to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test 1: Navigate to page 2
    const goToPage2Button = canvas.getByTestId("go-to-page-2");
    await userEvent.click(goToPage2Button);

    await waitForUpdate(1);
    const highlightInfo = canvas.getByTestId("current-highlight");
    expect(highlightInfo).toHaveTextContent("Page: 2");

    // Test 2: Navigate to page 3
    const goToPage3Button = canvas.getByTestId("go-to-page-3");
    await userEvent.click(goToPage3Button);

    await waitForUpdate(2);
    expect(canvas.getByTestId("current-highlight")).toHaveTextContent(
      "Page: 3"
    );

    // Test 3: Create small highlight
    const smallHighlightButton = canvas.getByTestId("small-highlight");
    await userEvent.click(smallHighlightButton);

    await waitForUpdate(3);
    expect(canvas.getByTestId("current-highlight")).toHaveTextContent(
      "Size: 100 × 50"
    );

    // Test 4: Create large highlight
    const largeHighlightButton = canvas.getByTestId("large-highlight");
    await userEvent.click(largeHighlightButton);

    await waitForUpdate(4);
    expect(canvas.getByTestId("current-highlight")).toHaveTextContent(
      "Size: 400 × 200"
    );

    // Test 5: Clear highlight
    const clearButton = canvas.getByTestId("clear-highlight");
    await userEvent.click(clearButton);

    await waitForUpdate(5);
    expect(canvas.getByTestId("current-highlight")).toHaveTextContent(
      "Size: 0 × 0"
    );

    // Test 6: Reset highlight to default
    const resetButton = canvas.getByTestId("reset-highlight");
    await userEvent.click(resetButton);

    await waitForUpdate(6);
    expect(canvas.getByTestId("current-highlight")).toHaveTextContent(
      "Page: 1"
    );
    expect(canvas.getByTestId("current-highlight")).toHaveTextContent(
      "Size: 300 × 100"
    );

    // Verify test log has entries
    const testLog = canvas.getByTestId("test-log");
    expect(testLog.textContent).toContain("Highlight updated");

    // Final verification
    expect(canvas.getByTestId("update-counter")).toHaveTextContent(
      "Updates: 6"
    );
  },
};

export const UploadAndPreview: Story = {
  render: () => <UploadAndPreviewExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Load the local PDF file from Storybook static directory
    const response = await fetch("/large-pdf-file.pdf");
    const pdfBlob = await response.blob();
    const mockFile = new File([pdfBlob], "large-pdf-file.pdf", {
      type: "application/pdf",
    });

    // Simulate file upload
    const fileInputElement = canvas.getByTestId(
      "pdf-file-input"
    ) as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(mockFile);
    fileInputElement.files = dataTransfer.files;
    const changeEvent = new Event("change", { bubbles: true });
    fileInputElement.dispatchEvent(changeEvent);

    // Verify PDF preview container is present
    const pdfContainer = canvas.getByTestId("pdf-preview-container");

    // Check pdf container is present
    expect(pdfContainer).toBeInTheDocument();

    // Check showing rendering progress bar
    await waitFor(() => {
      const loadingText = canvas.getByText("Rendering PDF…");
      expect(loadingText).toBeInTheDocument();
    });
  },
};

// We can use these files for testing:
// https://issuu.com/pamperedchef/docs/pamperedchef-ss25-us-catalog
function UploadAndPreviewExample() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Upload Section */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">PDF Upload & Preview</h2>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          data-testid="pdf-file-input"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* PDF Preview Section */}
      <div className="flex-1 min-h-0" data-testid="pdf-preview-container">
        {pdfUrl ? (
          <div className="h-full min-h-0" data-testid="pdf-preview">
            <PdfPreview url={pdfUrl} />
          </div>
        ) : (
          <div
            className="flex items-center justify-center h-full text-gray-500"
            data-testid="no-pdf-selected"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <div>No PDF selected</div>
              <div className="text-sm">Choose a PDF file to preview</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
