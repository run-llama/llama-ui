import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, within, userEvent, waitFor } from "@storybook/test";
import { ImagePreview } from "../../src/file-preview/image-preview";
import type { BoundingBox } from "../../src/file-preview/types";

const meta: Meta<typeof ImagePreview> = {
  title: "Components/FilePreview/ImagePreview",
  component: ImagePreview,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    src: {
      control: "text",
      description: "URL or data URL of the image to preview",
    },
    boundingBoxes: {
      control: "object",
      description: "Array of bounding boxes to overlay on the image",
    },
    onBoundingBoxClick: {
      action: "boundingBoxClick",
      description: "Callback when a bounding box is clicked",
    },
    onImageLoad: {
      action: "imageLoad",
      description: "Callback when the image loads with dimensions",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample image URLs for testing
const sampleImages = {
  landscape: "https://picsum.photos/800/600?random=1",
  portrait: "https://picsum.photos/400/600?random=2",
  square: "https://picsum.photos/500/500?random=3",
  small: "https://picsum.photos/200/150?random=4",
  large: "https://picsum.photos/1200/800?random=5",
};

// Sample bounding boxes for testing
const sampleBoundingBoxes: BoundingBox[] = [
  {
    id: "box1",
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    confidence: 0.95,
    label: "Person",
    color: "#ff0000",
  },
  {
    id: "box2",
    x: 300,
    y: 200,
    width: 150,
    height: 100,
    confidence: 0.87,
    label: "Car",
    color: "#00ff00",
  },
  {
    id: "box3",
    x: 50,
    y: 300,
    width: 100,
    height: 80,
    confidence: 0.72,
    label: "Building",
    color: "#0000ff",
  },
];

export const Default: Story = {
  args: {
    src: sampleImages.landscape,
  },
  render: (args) => (
    <div className="h-screen p-4">
      <ImagePreview {...args} />
    </div>
  ),
};

export const WithBoundingBoxes: Story = {
  args: {
    src: sampleImages.landscape,
    boundingBoxes: sampleBoundingBoxes,
  },
  render: (args) => (
    <div className="h-screen p-4">
      <ImagePreview {...args} />
    </div>
  ),
};

export const PortraitImage: Story = {
  args: {
    src: sampleImages.portrait,
    boundingBoxes: [
      {
        id: "portrait-box",
        x: 50,
        y: 100,
        width: 300,
        height: 200,
        confidence: 0.91,
        label: "Portrait Subject",
        color: "#ff6b6b",
      },
    ],
  },
  render: (args) => (
    <div className="h-screen p-4">
      <ImagePreview {...args} />
    </div>
  ),
};

export const SquareImage: Story = {
  args: {
    src: sampleImages.square,
    boundingBoxes: [
      {
        id: "center-box",
        x: 150,
        y: 150,
        width: 200,
        height: 200,
        confidence: 0.88,
        label: "Center Object",
        color: "#4ecdc4",
      },
    ],
  },
  render: (args) => (
    <div className="h-screen p-4">
      <ImagePreview {...args} />
    </div>
  ),
};

export const SmallImage: Story = {
  args: {
    src: sampleImages.small,
    boundingBoxes: [
      {
        id: "small-box",
        x: 20,
        y: 20,
        width: 80,
        height: 60,
        confidence: 0.76,
        label: "Small Object",
        color: "#45b7d1",
      },
    ],
  },
  render: (args) => (
    <div className="h-screen p-4">
      <ImagePreview {...args} />
    </div>
  ),
};

export const LargeImage: Story = {
  args: {
    src: sampleImages.large,
    boundingBoxes: [
      {
        id: "large-box1",
        x: 200,
        y: 150,
        width: 300,
        height: 200,
        confidence: 0.93,
        label: "Large Object 1",
        color: "#f9ca24",
      },
      {
        id: "large-box2",
        x: 600,
        y: 400,
        width: 250,
        height: 180,
        confidence: 0.85,
        label: "Large Object 2",
        color: "#6c5ce7",
      },
    ],
  },
  render: (args) => (
    <div className="h-screen p-4">
      <ImagePreview {...args} />
    </div>
  ),
};

// Interactive Test Component
function ImagePreviewTestsComponent() {
  const [currentImage, setCurrentImage] = useState(sampleImages.landscape);
  const [boundingBoxes, setBoundingBoxes] =
    useState<BoundingBox[]>(sampleBoundingBoxes);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [updateCount, setUpdateCount] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const addLog = (message: string) => {
    setTestLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleImageLoad = (dimensions: { width: number; height: number }) => {
    setImageDimensions(dimensions);
    addLog(`Image loaded: ${dimensions.width}x${dimensions.height}`);
  };

  const handleBoundingBoxClick = (box: BoundingBox) => {
    addLog(
      `Bounding box clicked: ${box.label} (confidence: ${box.confidence})`
    );
  };

  const changeImage = (imageKey: keyof typeof sampleImages) => {
    setCurrentImage(sampleImages[imageKey]);
    setUpdateCount((prev) => prev + 1);
    addLog(`Changed to ${imageKey} image`);
  };

  const addRandomBoundingBox = () => {
    const newBox: BoundingBox = {
      id: `box-${Date.now()}`,
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50,
      width: Math.random() * 200 + 100,
      height: Math.random() * 150 + 80,
      confidence: Math.random() * 0.3 + 0.7,
      label: `Object ${boundingBoxes.length + 1}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
    setBoundingBoxes((prev) => [...prev, newBox]);
    setUpdateCount((prev) => prev + 1);
    addLog(`Added bounding box: ${newBox.label}`);
  };

  const clearBoundingBoxes = () => {
    setBoundingBoxes([]);
    setUpdateCount((prev) => prev + 1);
    addLog("Cleared all bounding boxes");
  };

  const resetBoundingBoxes = () => {
    setBoundingBoxes(sampleBoundingBoxes);
    setUpdateCount((prev) => prev + 1);
    addLog("Reset to default bounding boxes");
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
            Image Preview Interactive Tests
          </h3>
          <div
            data-testid="update-counter"
            style={{ fontSize: "12px", color: "#666" }}
          >
            Updates: {updateCount}
          </div>
          <div
            data-testid="image-dimensions"
            style={{ fontSize: "12px", color: "#666" }}
          >
            Image: {imageDimensions.width}x{imageDimensions.height}
          </div>
        </div>

        {/* Current bounding boxes info */}
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
            Bounding Boxes ({boundingBoxes.length}):
          </div>
          <div
            data-testid="bounding-boxes-count"
            style={{ fontSize: "11px", fontFamily: "monospace" }}
          >
            {boundingBoxes.map((box, index) => (
              <div key={box.id}>
                {index + 1}. {box.label} ({box.confidence?.toFixed(2)})
              </div>
            ))}
          </div>
        </div>

        {/* Image selection controls */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Image Selection:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {Object.entries(sampleImages).map(([key]) => (
              <button
                key={key}
                data-testid={`select-${key}-image`}
                onClick={() => changeImage(key as keyof typeof sampleImages)}
                style={{
                  padding: "6px 8px",
                  fontSize: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)} Image
              </button>
            ))}
          </div>
        </div>

        {/* Bounding box controls */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Bounding Box Tests:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              data-testid="add-random-box"
              onClick={addRandomBoundingBox}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Add Random Box
            </button>
            <button
              data-testid="clear-boxes"
              onClick={clearBoundingBoxes}
              style={{
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Clear All Boxes
            </button>
            <button
              data-testid="reset-boxes"
              onClick={resetBoundingBoxes}
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

      {/* Right panel: Image Preview */}
      <div style={{ flex: 1, padding: "16px" }}>
        <ImagePreview
          src={currentImage}
          boundingBoxes={boundingBoxes}
          onBoundingBoxClick={handleBoundingBoxClick}
          onImageLoad={handleImageLoad}
        />
      </div>
    </div>
  );
}

export const InteractiveTests: Story = {
  render: () => <ImagePreviewTestsComponent />,
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

    // Wait for image to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 1: Change to portrait image
    const portraitButton = canvas.getByTestId("select-portrait-image");
    await userEvent.click(portraitButton);

    await waitForUpdate(1);
    expect(canvas.getByTestId("test-log")).toHaveTextContent(
      "Changed to portrait image"
    );

    // Test 2: Add random bounding box
    const addRandomButton = canvas.getByTestId("add-random-box");
    await userEvent.click(addRandomButton);

    await waitForUpdate(2);
    expect(canvas.getByTestId("bounding-boxes-count")).toHaveTextContent(
      "Object 4"
    );

    // Test 3: Clear all bounding boxes
    const clearButton = canvas.getByTestId("clear-boxes");
    await userEvent.click(clearButton);

    await waitForUpdate(3);
    expect(canvas.getByTestId("bounding-boxes-count")).toHaveTextContent("");

    // Test 4: Reset bounding boxes
    const resetButton = canvas.getByTestId("reset-boxes");
    await userEvent.click(resetButton);

    await waitForUpdate(4);
    expect(canvas.getByTestId("bounding-boxes-count")).toHaveTextContent(
      "Person"
    );

    // Test 5: Change to square image
    const squareButton = canvas.getByTestId("select-square-image");
    await userEvent.click(squareButton);

    await waitForUpdate(5);
    expect(canvas.getByTestId("test-log")).toHaveTextContent(
      "Changed to square image"
    );

    // Verify test log has entries
    const testLog = canvas.getByTestId("test-log");
    expect(testLog.textContent).toContain("Image loaded");
    expect(testLog.textContent).toContain("Changed to");

    // Final verification
    expect(canvas.getByTestId("update-counter")).toHaveTextContent(
      "Updates: 5"
    );
  },
};

export const UploadAndPreview: Story = {
  render: () => <UploadAndPreviewExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Create a mock image file
    const canvasElement2 = document.createElement("canvas");
    canvasElement2.width = 400;
    canvasElement2.height = 300;
    const ctx = canvasElement2.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#4ecdc4";
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = "#fff";
      ctx.font = "20px Arial";
      ctx.fillText("Test Image", 150, 150);
    }
    const dataURL = canvasElement2.toDataURL("image/png");
    const mockFile = new File([dataURL], "test-image.png", {
      type: "image/png",
    });

    // Simulate file upload
    const fileInputElement = canvas.getByTestId(
      "image-file-input"
    ) as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(mockFile);
    fileInputElement.files = dataTransfer.files;
    const changeEvent = new Event("change", { bubbles: true });
    fileInputElement.dispatchEvent(changeEvent);

    // Verify image preview container is present
    const imageContainer = canvas.getByTestId("image-preview-container");

    // Check image container is present
    expect(imageContainer).toBeInTheDocument();

    // Wait for image to load
    await waitFor(() => {
      const imageElement = canvas.getByAltText("Preview");
      expect(imageElement).toBeInTheDocument();
    });
  },
};

function UploadAndPreviewExample() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      // Add some sample bounding boxes for uploaded images
      setBoundingBoxes([
        {
          id: "uploaded-box-1",
          x: 50,
          y: 50,
          width: 100,
          height: 80,
          confidence: 0.85,
          label: "Detected Object",
          color: "#ff6b6b",
        },
      ]);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Upload Section */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Image Upload & Preview</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          data-testid="image-file-input"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Image Preview Section */}
      <div className="flex-1 min-h-0 p-4" data-testid="image-preview-container">
        {imageUrl ? (
          <div className="h-full min-h-0" data-testid="image-preview">
            <ImagePreview
              src={imageUrl}
              boundingBoxes={boundingBoxes}
              onBoundingBoxClick={(box) => console.log("Clicked:", box)}
              onImageLoad={(dimensions) =>
                console.log("Image loaded:", dimensions)
              }
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center h-full text-gray-500"
            data-testid="no-image-selected"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <div>No image selected</div>
              <div className="text-sm">Choose an image file to preview</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
