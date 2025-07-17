import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  UploadProgress,
  type FileUploadProgress,
} from "../src/file-uploader";

const meta: Meta<typeof UploadProgress> = {
  title: "Components/UploadProgress",
  component: UploadProgress,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof UploadProgress>;

// Mock files for testing
const createMockFile = (name: string): File => {
  return new File([""], name, { type: "application/pdf" });
};

const mockFiles: FileUploadProgress[] = [
  {
    file: createMockFile("File1.pdf"), // 123MB
    progress: 75,
    status: "uploading",
  },
  {
    file: createMockFile("File2.pdf"), // 123MB
    progress: 100,
    status: "completed",
  },
  {
    file: createMockFile("File3.pdf"), // 123MB
    progress: 30,
    status: "error",
    error: "Upload failed",
  },
];

export const FewFiles: Story = {
  args: {
    files: mockFiles, // 3 files - simple mode without overall progress
    onClose: () => console.log("Close clicked"),
  },
};

export const ManyFiles: Story = {
  args: {
    files: Array.from({ length: 15 }, (_, i) => ({
      file: createMockFile(`Document${i + 1}.pdf`), // 50MB each
      progress: (i * 7) % 100, // Deterministic progress
      status: i % 5 === 0 ? "error" : i % 3 === 0 ? "completed" : "uploading",
      error: i % 5 === 0 ? "Network error" : undefined,
    })) as FileUploadProgress[],
    onClose: () => console.log("Close clicked"),
  },
};
