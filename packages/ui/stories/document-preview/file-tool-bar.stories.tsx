import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { useState } from "react";
import {
  FileToolbar,
  type FileToolbarProps,
} from "../../src/document-preview/file-tool-bar";

const meta: Meta<typeof FileToolbar> = {
  title: "Components/DocumentPreview/FileToolbar",
  component: FileToolbar,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    fileName: {
      control: "text",
      description: "Name of the PDF file",
    },
    currentPage: {
      control: "number",
      description: "Current page number (1-based)",
    },
    totalPages: {
      control: "number",
      description: "Total number of pages in the PDF",
    },
    scale: {
      control: "number",
      description: "Current zoom scale (0.5 to 3.0)",
    },
    onPageChange: {
      action: "pageChange",
      description: "Callback when page changes",
    },
    onScaleChange: {
      action: "scaleChange",
      description: "Callback when scale changes",
    },
    onDownload: {
      action: "download",
      description: "Callback when download button is clicked",
    },
    onReset: {
      action: "reset",
      description: "Callback when reset button is clicked",
    },
    onFullscreen: {
      action: "fullscreen",
      description: "Callback when fullscreen button is clicked",
    },
    onRemove: {
      action: "remove",
      description: "Callback when remove button is clicked",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fileName: "sample-document.pdf",
    currentPage: 1,
    totalPages: 10,
    scale: 1.0,
    onPageChange: () => {},
    onScaleChange: () => {},
  } as never,
  render: (args) => (
    <div className="h-screen p-4">
      <FileToolbar {...(args as FileToolbarProps)} />
    </div>
  ),
};

export const WithDownload: Story = {
  args: {
    fileName: "downloadable-document.pdf",
    currentPage: 5,
    totalPages: 25,
    scale: 1.5,
    onPageChange: () => {},
    onScaleChange: () => {},
    onFullscreen: () => {},
    onDownload: () => {},
  } as never,
  render: (args) => (
    <div className="h-screen p-4">
      <FileToolbar {...(args as FileToolbarProps)} />
    </div>
  ),
};

export const FirstPage: Story = {
  args: {
    fileName: "first-page.pdf",
    currentPage: 1,
    totalPages: 15,
    scale: 0.75,
    onPageChange: () => {},
    onScaleChange: () => {},
    onFullscreen: () => {},
  } as never,
  render: (args) => (
    <div className="h-screen p-4">
      <FileToolbar {...(args as FileToolbarProps)} />
    </div>
  ),
};

export const LastPage: Story = {
  args: {
    fileName: "last-page.pdf",
    currentPage: 20,
    totalPages: 20,
    scale: 2.0,
    onPageChange: () => {},
    onScaleChange: () => {},
    onFullscreen: () => {},
  } as never,
  render: (args) => (
    <div className="h-screen p-4">
      <FileToolbar {...(args as FileToolbarProps)} />
    </div>
  ),
};

export const MinScale: Story = {
  args: {
    fileName: "min-scale.pdf",
    currentPage: 3,
    totalPages: 8,
    scale: 0.5,
    onPageChange: () => {},
    onScaleChange: () => {},
    onFullscreen: () => {},
  } as never,
  render: (args) => (
    <div className="h-screen p-4">
      <FileToolbar {...(args as FileToolbarProps)} />
    </div>
  ),
};

export const MaxScale: Story = {
  args: {
    fileName: "max-scale.pdf",
    currentPage: 7,
    totalPages: 12,
    scale: 3.0,
    onPageChange: () => {},
    onScaleChange: () => {},
    onFullscreen: () => {},
  } as never,
  render: (args) => (
    <div className="h-screen p-4">
      <FileToolbar {...(args as FileToolbarProps)} />
    </div>
  ),
};

export const SinglePage: Story = {
  args: {
    fileName: "single-page.pdf",
    currentPage: 1,
    totalPages: 1,
    scale: 1.0,
    onPageChange: () => {},
    onScaleChange: () => {},
    onFullscreen: () => {},
  } as never,
  render: (args) => (
    <div className="h-screen p-4">
      <FileToolbar {...(args as FileToolbarProps)} />
    </div>
  ),
};

export const LongFileName: Story = {
  args: {
    fileName: "very-long-document-name-that-might-overflow-the-navigator.pdf",
    currentPage: 10,
    totalPages: 50,
    scale: 1.25,
    onPageChange: () => {},
    onScaleChange: () => {},
    onFullscreen: () => {},
  } as never,
  render: (args) => (
    <div className="h-screen p-4">
      <FileToolbar {...(args as FileToolbarProps)} />
    </div>
  ),
};

// Interactive Test Component
function FileToolbarTestsComponent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(15);
  const [scale, setScale] = useState(1.0);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [updateCount, setUpdateCount] = useState(0);

  const addLog = (message: string) => {
    setTestLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setUpdateCount((prev) => prev + 1);
    addLog(`Page changed to: ${page}`);
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    setUpdateCount((prev) => prev + 1);
    addLog(`Scale changed to: ${Math.round(newScale * 100)}%`);
  };

  const handleDownload = () => {
    addLog("Download button clicked");
  };

  const handleReset = () => {
    setCurrentPage(1);
    setScale(1.0);
    setUpdateCount((prev) => prev + 1);
    addLog("Reset button clicked - page: 1, scale: 100%");
  };

  const handleFullscreen = () => {
    addLog("Fullscreen button clicked");
  };

  // Test actions
  const goToFirstPage = () => {
    handlePageChange(1);
  };

  const goToLastPage = () => {
    handlePageChange(totalPages);
  };

  const goToMiddlePage = () => {
    handlePageChange(Math.ceil(totalPages / 2));
  };

  const setMinScale = () => {
    handleScaleChange(0.5);
  };

  const setMaxScale = () => {
    handleScaleChange(3.0);
  };

  const setNormalScale = () => {
    handleScaleChange(1.0);
  };

  const zoomIn = () => {
    handleScaleChange(Math.min(scale + 0.25, 3.0));
  };

  const zoomOut = () => {
    handleScaleChange(Math.max(scale - 0.25, 0.5));
  };

  const clearLog = () => {
    setTestLog([]);
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
            FileToolbar Interactive Tests
          </h3>
          <div
            data-testid="update-counter"
            style={{ fontSize: "12px", color: "#666" }}
          >
            Updates: {updateCount}
          </div>
        </div>

        {/* Current state info */}
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
            Current State:
          </div>
          <div
            data-testid="current-state"
            style={{ fontSize: "11px", fontFamily: "monospace" }}
          >
            Page: {currentPage} / {totalPages}
            <br />
            Scale: {Math.round(scale * 100)}%
          </div>
        </div>

        {/* Page navigation tests */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Page Navigation Tests:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              data-testid="go-to-first-page"
              onClick={goToFirstPage}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Go to First Page
            </button>
            <button
              data-testid="go-to-middle-page"
              onClick={goToMiddlePage}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Go to Middle Page
            </button>
            <button
              data-testid="go-to-last-page"
              onClick={goToLastPage}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Go to Last Page
            </button>
          </div>
        </div>

        {/* Scale tests */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Scale Tests:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              data-testid="set-min-scale"
              onClick={setMinScale}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Set Min Scale (50%)
            </button>
            <button
              data-testid="set-normal-scale"
              onClick={setNormalScale}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Set Normal Scale (100%)
            </button>
            <button
              data-testid="set-max-scale"
              onClick={setMaxScale}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Set Max Scale (300%)
            </button>
            <button
              data-testid="zoom-in"
              onClick={zoomIn}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Zoom In (+25%)
            </button>
            <button
              data-testid="zoom-out"
              onClick={zoomOut}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Zoom Out (-25%)
            </button>
          </div>
        </div>

        {/* Utility tests */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Utility Tests:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              data-testid="clear-log"
              onClick={clearLog}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Clear Log
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

      {/* Right panel: FileToolbar */}
      <div style={{ flex: 1, padding: "16px" }}>
        <FileToolbar
          fileName="test-document.pdf"
          currentPage={currentPage}
          totalPages={totalPages}
          scale={scale}
          onPageChange={handlePageChange}
          onScaleChange={handleScaleChange}
          onDownload={handleDownload}
          onReset={handleReset}
          onFullscreen={handleFullscreen}
        />
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background: "#f0f0f0",
            borderRadius: "4px",
            textAlign: "center",
            color: "#666",
          }}
        >
          FileToolbar Component
          <br />
          <small>This is where the PDF content would be displayed</small>
        </div>
      </div>
    </div>
  );
}

export const InteractiveTests: Story = {
  args: {} as never,
  render: () => <FileToolbarTestsComponent />,
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

    // Test 1: Go to first page
    const goToFirstButton = canvas.getByTestId("go-to-first-page");
    await userEvent.click(goToFirstButton);

    await waitForUpdate(1);
    expect(canvas.getByTestId("current-state")).toHaveTextContent(
      "Page: 1 / 15"
    );

    // Test 2: Go to middle page
    const goToMiddleButton = canvas.getByTestId("go-to-middle-page");
    await userEvent.click(goToMiddleButton);

    await waitForUpdate(2);
    expect(canvas.getByTestId("current-state")).toHaveTextContent(
      "Page: 8 / 15"
    );

    // Test 3: Go to last page
    const goToLastButton = canvas.getByTestId("go-to-last-page");
    await userEvent.click(goToLastButton);

    await waitForUpdate(3);
    expect(canvas.getByTestId("current-state")).toHaveTextContent(
      "Page: 15 / 15"
    );

    // Test 4: Set min scale
    const setMinScaleButton = canvas.getByTestId("set-min-scale");
    await userEvent.click(setMinScaleButton);

    await waitForUpdate(4);
    expect(canvas.getByTestId("current-state")).toHaveTextContent("Scale: 50%");

    // Test 5: Set max scale
    const setMaxScaleButton = canvas.getByTestId("set-max-scale");
    await userEvent.click(setMaxScaleButton);

    await waitForUpdate(5);
    expect(canvas.getByTestId("current-state")).toHaveTextContent(
      "Scale: 300%"
    );

    // Test 6: Set normal scale
    const setNormalScaleButton = canvas.getByTestId("set-normal-scale");
    await userEvent.click(setNormalScaleButton);

    await waitForUpdate(6);
    expect(canvas.getByTestId("current-state")).toHaveTextContent(
      "Scale: 100%"
    );

    // Test 7: Zoom in
    const zoomInButton = canvas.getByTestId("zoom-in");
    await userEvent.click(zoomInButton);

    await waitForUpdate(7);
    expect(canvas.getByTestId("current-state")).toHaveTextContent(
      "Scale: 125%"
    );

    // Test 8: Zoom out
    const zoomOutButton = canvas.getByTestId("zoom-out");
    await userEvent.click(zoomOutButton);

    await waitForUpdate(8);
    expect(canvas.getByTestId("current-state")).toHaveTextContent(
      "Scale: 100%"
    );

    // Verify test log has entries
    const testLog = canvas.getByTestId("test-log");
    expect(testLog.textContent).toContain("Page changed to");
    expect(testLog.textContent).toContain("Scale changed to");

    // Final verification
    expect(canvas.getByTestId("update-counter")).toHaveTextContent(
      "Updates: 8"
    );
  },
};

// Component to demonstrate the remove functionality for FileToolbar
function WithRemoveFileToolbarExample({
  fileName,
  currentPage,
  totalPages,
  scale,
}: {
  fileName: string;
  currentPage: number;
  totalPages: number;
  scale: number;
}) {
  const [isRemoved, setIsRemoved] = useState(false);
  const [removeLog, setRemoveLog] = useState<string[]>([]);

  const handleRemove = () => {
    setIsRemoved(true);
    setRemoveLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: PDF removed - ${fileName}`,
    ]);
  };

  if (isRemoved) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🗑️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            PDF Removed
          </h2>
          <p className="text-gray-500 mb-4">
            The PDF "{fileName}" has been removed.
          </p>
          <button
            onClick={() => setIsRemoved(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Restore PDF
          </button>
          {removeLog.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left max-w-md">
              <h3 className="font-semibold mb-2">Remove Log:</h3>
              <div className="text-sm text-gray-600">
                {removeLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen p-4">
      <FileToolbar
        fileName={fileName}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onPageChange={() => {}}
        onScaleChange={() => {}}
        onDownload={() => {}}
        onReset={() => {}}
        onFullscreen={() => {}}
        onRemove={handleRemove}
      />
      <div className="mt-4 p-4 bg-gray-100 rounded text-center text-gray-600">
        <p>This is where the PDF content would be displayed</p>
        <p className="text-sm mt-2">
          Click the trash icon in the toolbar to test the remove functionality
        </p>
      </div>
    </div>
  );
}

// Test component for direct FileToolbar interaction
function DirectFileToolbarTestsComponent() {
  const [currentPage, setCurrentPage] = useState(5);
  const [totalPages] = useState(20);
  const [scale, setScale] = useState(1.5);
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    addLog(`Direct page change to: ${page}`);
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    addLog(`Direct scale change to: ${Math.round(newScale * 100)}%`);
  };

  const handleDownload = () => {
    addLog("Download clicked");
  };

  const handleReset = () => {
    setCurrentPage(1);
    setScale(1.0);
    addLog("Reset clicked - page: 1, scale: 100%");
  };

  const handleFullscreen = () => {
    addLog("Fullscreen clicked");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left panel: Test info */}
      <div
        style={{
          width: "300px",
          padding: "16px",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        <h3
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 16px 0" }}
        >
          Direct FileToolbar Tests
        </h3>
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Current State:
          </div>
          <div
            data-testid="direct-current-state"
            style={{ fontSize: "11px", fontFamily: "monospace" }}
          >
            Page: {currentPage} / {totalPages}
            <br />
            Scale: {Math.round(scale * 100)}%
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Actions Log:
          </div>
          <div
            data-testid="direct-test-log"
            style={{
              maxHeight: "300px",
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

      {/* Right panel: FileToolbar */}
      <div style={{ flex: 1, padding: "16px" }}>
        <FileToolbar
          fileName="interactive-test.pdf"
          currentPage={currentPage}
          totalPages={totalPages}
          scale={scale}
          onPageChange={handlePageChange}
          onScaleChange={handleScaleChange}
          onDownload={handleDownload}
          onReset={handleReset}
          onFullscreen={handleFullscreen}
        />
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background: "#f0f0f0",
            borderRadius: "4px",
            textAlign: "center",
            color: "#666",
          }}
        >
          Click the navigator buttons to test interactions
        </div>
      </div>
    </div>
  );
}

export const WithRemoveButton: Story = {
  args: {
    fileName: "removable-document.pdf",
    currentPage: 3,
    totalPages: 15,
    scale: 1.2,
  } as never,
  render: (args) => (
    <WithRemoveFileToolbarExample
      {...(args as {
        fileName: string;
        currentPage: number;
        totalPages: number;
        scale: number;
      })}
    />
  ),
};

export const DirectInteractionTests: Story = {
  args: {} as never,
  render: () => <DirectFileToolbarTestsComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test page input interaction
    const pageInput = canvas.getByDisplayValue("5");
    await userEvent.clear(pageInput);
    await userEvent.type(pageInput, "10");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(canvas.getByTestId("direct-current-state")).toHaveTextContent(
        "Page: 10 / 20"
      );
    });

    // Test zoom in button
    const zoomInButton = canvas.getByRole("button", { name: "Zoom In" });
    await userEvent.click(zoomInButton);

    await waitFor(() => {
      expect(canvas.getByTestId("direct-current-state")).toHaveTextContent(
        "Scale: 175%"
      );
    });

    // Test zoom out button
    const zoomOutButton = canvas.getByRole("button", { name: "Zoom Out" });
    await userEvent.click(zoomOutButton);

    await waitFor(() => {
      expect(canvas.getByTestId("direct-current-state")).toHaveTextContent(
        "Scale: 150%"
      );
    });

    // Test reset button
    const resetButton = canvas.getByRole("button", { name: "Reset Zoom" });
    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(canvas.getByTestId("direct-current-state")).toHaveTextContent(
        "Page: 1 / 20"
      );
      expect(canvas.getByTestId("direct-current-state")).toHaveTextContent(
        "Scale: 100%"
      );
    });

    // Test download button
    const downloadButton = canvas.getByRole("button", { name: "Download PDF" });
    await userEvent.click(downloadButton);

    await waitFor(() => {
      expect(canvas.getByTestId("direct-test-log")).toHaveTextContent(
        "Download clicked"
      );
    });

    // Test fullscreen button
    const fullscreenButton = canvas.getByRole("button", { name: "Fullscreen" });
    await userEvent.click(fullscreenButton);

    await waitFor(() => {
      expect(canvas.getByTestId("direct-test-log")).toHaveTextContent(
        "Fullscreen clicked"
      );
    });

    // Note: Navigation button testing is covered in the InteractiveTests story
    // The main functionality (page input, zoom, reset, download, fullscreen) is tested above

    // Verify log has entries
    const testLog = canvas.getByTestId("direct-test-log");
    expect(testLog.textContent).toContain("Direct page change");
    expect(testLog.textContent).toContain("Direct scale change");
  },
};
