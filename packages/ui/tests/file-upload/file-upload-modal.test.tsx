import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FileUploader } from "@/src/file-upload";
import type { FileUploadData } from "@/src/file-upload";
import * as useFileUploadModule from "@/src/file-upload/hooks/use-file-upload";

const createMockFile = (name: string) =>
  new File(["mock-content"], name, { type: "application/pdf" });

describe("FileUploader", () => {
  const uploadAndReturnMock = vi.fn();
  const uploadFromUrlMock = vi.fn();

  beforeEach(() => {
    uploadAndReturnMock.mockReset();
    uploadFromUrlMock.mockReset();

    vi.spyOn(useFileUploadModule, "useFileUpload").mockReturnValue({
      isUploading: false,
      uploadFile: uploadAndReturnMock,
      uploadFromUrl: uploadFromUrlMock,
      uploadAndReturn: uploadAndReturnMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uploads a selected file and forwards form data", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockFile = createMockFile("example.pdf");
    const uploadResult: FileUploadData = {
      file: mockFile,
      fileId: "file-123",
      url: "https://files.example.com/example.pdf",
    };
    uploadAndReturnMock.mockResolvedValueOnce({
      success: true,
      data: uploadResult,
      error: null,
    });

    render(
      <FileUploader
        title="Upload Document"
        inputFields={[
          { key: "project", label: "Project", required: true },
          { key: "notes", label: "Notes" },
        ]}
        onSuccess={onSuccess}
      />
    );

    await user.click(screen.getByRole("button", { name: /upload file/i }));

    await user.type(screen.getByLabelText("Project"), "Apollo Mission");
    await user.type(screen.getByLabelText("Notes"), "Initial upload");

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    await user.upload(fileInput, mockFile);

    await user.click(screen.getByRole("button", { name: /upload & process/i }));

    expect(uploadAndReturnMock).toHaveBeenCalledWith(mockFile);
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith([uploadResult], {
        project: "Apollo Mission",
        notes: "Initial upload",
      })
    );
  });

  it("uploads from URL when no local file is selected", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const uploadResult: FileUploadData = {
      file: createMockFile("remote.pdf"),
      fileId: "remote-id",
      url: "https://files.example.com/remote.pdf",
    };
    uploadFromUrlMock.mockResolvedValueOnce({
      success: true,
      data: uploadResult,
      error: null,
    });

    render(<FileUploader title="Upload Document" onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: /upload file/i }));

    const tabs = screen.getByRole("tablist");
    await user.click(within(tabs).getByRole("tab", { name: /file url/i }));

    await user.type(
      screen.getByPlaceholderText(/paste the file link/i),
      "https://example.com/doc.pdf"
    );

    await user.click(screen.getByRole("button", { name: /upload & process/i }));

    expect(uploadFromUrlMock).toHaveBeenCalledWith(
      "https://example.com/doc.pdf"
    );
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith([uploadResult], {
        fileUrl: "https://example.com/doc.pdf",
      })
    );
  });

  it("prevents submission when required fields are missing", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockFile = createMockFile("required.pdf");

    render(
      <FileUploader
        title="Upload Document"
        inputFields={[{ key: "project", label: "Project", required: true }]}
        onSuccess={onSuccess}
      />
    );

    await user.click(screen.getByRole("button", { name: /upload file/i }));

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    await user.upload(fileInput, mockFile);

    await user.click(screen.getByRole("button", { name: /upload & process/i }));

    expect(screen.getByText(/project is required/i)).toBeVisible();
    expect(uploadAndReturnMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("uploads multiple files sequentially when multi mode is enabled", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fileA = createMockFile("first.pdf");
    const fileB = createMockFile("second.pdf");
    const resultA: FileUploadData = {
      file: fileA,
      fileId: "file-a",
      url: "https://files.example.com/first.pdf",
    };
    const resultB: FileUploadData = {
      file: fileB,
      fileId: "file-b",
      url: "https://files.example.com/second.pdf",
    };

    uploadAndReturnMock
      .mockResolvedValueOnce({ success: true, data: resultA, error: null })
      .mockResolvedValueOnce({ success: true, data: resultB, error: null });

    render(<FileUploader multiple onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: /upload files/i }));

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.multiple).toBe(true);

    await user.upload(fileInput, [fileA, fileB]);

    const submitButton = screen.getByRole("button", {
      name: /upload 2 files & process/i,
    });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(uploadAndReturnMock).toHaveBeenNthCalledWith(1, fileA);
    expect(uploadAndReturnMock).toHaveBeenNthCalledWith(2, fileB);
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith([resultA, resultB], {})
    );
  });
});
