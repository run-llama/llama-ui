import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useUploadProgress } from "@/src/file-upload";

const createMockFile = (name: string): File =>
  new File(["mock-content"], name, { type: "application/pdf" });

describe("useUploadProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds an upload to the queue and shows progress when starting", () => {
    const file = createMockFile("document.pdf");
    const { result } = renderHook(() => useUploadProgress());

    act(() => {
      result.current.startUpload(file);
    });

    expect(result.current.uploadProgressFiles).toHaveLength(1);
    expect(result.current.uploadProgressFiles[0]).toMatchObject({
      file,
      status: "uploading",
      progress: 0,
    });
    expect(result.current.isVisible).toBe(true);
  });

  it("updates and clears uploads after completion timeout", () => {
    const file = createMockFile("finish.pdf");
    const { result } = renderHook(() => useUploadProgress());

    act(() => {
      result.current.startUpload(file);
    });

    act(() => {
      result.current.completeUpload(file);
    });

    expect(result.current.uploadProgressFiles[0].status).toBe("completed");

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.uploadProgressFiles).toHaveLength(0);
    expect(result.current.isVisible).toBe(false);
  });

  it("marks uploads as failed and keeps them visible", () => {
    const file = createMockFile("error.pdf");
    const { result } = renderHook(() => useUploadProgress());

    act(() => {
      result.current.startUpload(file);
      result.current.failUpload(file, "network error");
    });

    expect(result.current.uploadProgressFiles[0]).toMatchObject({
      status: "error",
      error: "network error",
    });
    expect(result.current.isVisible).toBe(true);
  });

  it("supports manual clearing and hiding of uploads", () => {
    const file = createMockFile("cleanup.pdf");
    const { result } = renderHook(() => useUploadProgress());

    act(() => {
      result.current.startUpload(file);
      result.current.hideProgress();
    });

    expect(result.current.isVisible).toBe(false);

    act(() => {
      result.current.clearAllUploads();
    });

    expect(result.current.uploadProgressFiles).toHaveLength(0);
    expect(result.current.isVisible).toBe(false);
  });
});
