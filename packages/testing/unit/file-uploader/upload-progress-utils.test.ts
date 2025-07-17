import { describe, it, expect } from "vitest";
import {
  addUploadToQueue,
  updateFileProgress,
  completeFileUpload,
  failFileUpload,
  removeFileUpload,
  removeCompletedUploads,
  calculateUploadStats,
  hasActiveUploads,
  getVisibleFiles,
} from "@llamaindex/ui/src/file-uploader/upload-progress-utils";
import type { FileUploadProgress } from "@llamaindex/ui/src/file-uploader/upload-progress";

// Test utilities
const createMockFile = (name: string): File => {
  return new File([""], name, { type: "application/pdf" });
};

const createMockUpload = (
  name: string,
  progress: number = 0,
  status: FileUploadProgress["status"] = "uploading",
  error?: string,
): FileUploadProgress => ({
  file: createMockFile(name),
  progress,
  status,
  error,
});

describe("Upload Progress Utils", () => {
  describe("addUploadToQueue", () => {
    it("should add new file to empty queue", () => {
      const file = createMockFile("test.pdf");
      const result = addUploadToQueue([], file);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        file,
        progress: 0,
        status: "uploading",
      });
    });

    it("should add file to existing queue", () => {
      const existing = [createMockUpload("existing.pdf")];
      const newFile = createMockFile("new.pdf");
      const result = addUploadToQueue(existing, newFile);

      expect(result).toHaveLength(2);
      expect(result[1].file).toBe(newFile);
    });

    it("should replace existing file with same name", () => {
      const existing = [createMockUpload("same.pdf", 50)];
      const newFile = createMockFile("same.pdf");
      const result = addUploadToQueue(existing, newFile);

      expect(result).toHaveLength(1);
      expect(result[0].progress).toBe(0); // Reset to 0
    });
  });

  describe("updateFileProgress", () => {
    it("should update progress for correct file", () => {
      const uploads = [
        createMockUpload("file1.pdf", 20),
        createMockUpload("file2.pdf", 30),
      ];

      const result = updateFileProgress(uploads, uploads[0].file, 75);

      expect(result[0].progress).toBe(75);
      expect(result[1].progress).toBe(30); // Unchanged
    });

    it("should cap progress at 100", () => {
      const uploads = [createMockUpload("test.pdf")];
      const result = updateFileProgress(uploads, uploads[0].file, 150);

      expect(result[0].progress).toBe(100);
    });

    it("should not update non-matching files", () => {
      const uploads = [createMockUpload("file1.pdf", 20)];
      const differentFile = createMockFile("file2.pdf");
      const result = updateFileProgress(uploads, differentFile, 50);

      expect(result[0].progress).toBe(20); // Unchanged
    });
  });

  describe("completeFileUpload", () => {
    it("should mark file as completed with 100% progress", () => {
      const uploads = [createMockUpload("test.pdf", 80)];
      const result = completeFileUpload(uploads, uploads[0].file);

      expect(result[0]).toMatchObject({
        progress: 100,
        status: "completed",
      });
    });
  });

  describe("failFileUpload", () => {
    it("should mark file as failed with error message", () => {
      const uploads = [createMockUpload("test.pdf", 50)];
      const errorMessage = "Network error";
      const result = failFileUpload(uploads, uploads[0].file, errorMessage);

      expect(result[0]).toMatchObject({
        status: "error",
        error: errorMessage,
      });
    });
  });

  describe("removeFileUpload", () => {
    it("should remove specific file", () => {
      const uploads = [
        createMockUpload("file1.pdf"),
        createMockUpload("file2.pdf"),
      ];

      const result = removeFileUpload(uploads, uploads[0].file);

      expect(result).toHaveLength(1);
      expect(result[0].file.name).toBe("file2.pdf");
    });

    it("should handle non-existing file", () => {
      const uploads = [createMockUpload("file1.pdf")];
      const differentFile = createMockFile("file2.pdf");
      const result = removeFileUpload(uploads, differentFile);

      expect(result).toHaveLength(1); // Unchanged
    });
  });

  describe("removeCompletedUploads", () => {
    it("should remove only completed uploads", () => {
      const uploads = [
        createMockUpload("file1.pdf", 50, "uploading"),
        createMockUpload("file2.pdf", 100, "completed"),
        createMockUpload("file3.pdf", 30, "canceled"),
        createMockUpload("file4.pdf", 100, "completed"),
      ];

      const result = removeCompletedUploads(uploads);

      expect(result).toHaveLength(2);
      expect(result[0].file.name).toBe("file1.pdf");
      expect(result[1].file.name).toBe("file3.pdf");
    });
  });

  describe("calculateUploadStats", () => {
    it("should calculate correct statistics", () => {
      const uploads = [
        createMockUpload("file1.pdf", 50, "uploading"),
        createMockUpload("file2.pdf", 100, "completed"),
        createMockUpload("file3.pdf", 25, "canceled"),
        createMockUpload("file4.pdf", 0, "error"),
        createMockUpload("file5.pdf", 75, "uploading"),
      ];

      const stats = calculateUploadStats(uploads);

      expect(stats).toEqual({
        total: 5,
        uploading: 2,
        completed: 1,
        failed: 1,
        canceled: 1,
        totalProgress: 50, // (50 + 100 + 25 + 0 + 75) / 5 = 50
      });
    });

    it("should handle empty upload list", () => {
      const stats = calculateUploadStats([]);

      expect(stats).toEqual({
        total: 0,
        uploading: 0,
        completed: 0,
        failed: 0,
        canceled: 0,
        totalProgress: 0,
      });
    });
  });

  describe("hasActiveUploads", () => {
    it("should return true when uploads exist", () => {
      const uploads = [createMockUpload("test.pdf")];
      expect(hasActiveUploads(uploads)).toBe(true);
    });

    it("should return false when no uploads", () => {
      expect(hasActiveUploads([])).toBe(false);
    });
  });

  describe("getVisibleFiles", () => {
    const uploads = Array.from({ length: 8 }, (_, i) =>
      createMockUpload(`file${i}.pdf`),
    );

    it("should limit files when showAll is false", () => {
      const result = getVisibleFiles(uploads, false, 5);

      expect(result.filesToShow).toHaveLength(5);
      expect(result.shouldShowViewMore).toBe(true);
    });

    it("should show all files when showAll is true", () => {
      const result = getVisibleFiles(uploads, true, 5);

      expect(result.filesToShow).toHaveLength(8);
      expect(result.shouldShowViewMore).toBe(true);
    });

    it("should not show view more for small lists", () => {
      const smallUploads = uploads.slice(0, 3);
      const result = getVisibleFiles(smallUploads, false, 5);

      expect(result.filesToShow).toHaveLength(3);
      expect(result.shouldShowViewMore).toBe(false);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete upload workflow", () => {
      const file1 = createMockFile("doc1.pdf");
      const file2 = createMockFile("doc2.pdf");

      // Add files to queue
      let uploads = addUploadToQueue([], file1);
      uploads = addUploadToQueue(uploads, file2);
      expect(uploads).toHaveLength(2);

      // Update progress
      uploads = updateFileProgress(uploads, file1, 50);
      uploads = updateFileProgress(uploads, file2, 25);

      // Complete first file
      uploads = completeFileUpload(uploads, file1);
      expect(uploads[0].status).toBe("completed");

      // Fail second file
      uploads = failFileUpload(uploads, file2, "Upload failed");
      expect(uploads[1].status).toBe("error");

      // Check stats
      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });

    it("should handle bulk operation scenario", () => {
      const files = Array.from({ length: 5 }, (_, i) =>
        createMockFile(`file${i}.pdf`),
      );

      // Add all files
      let uploads: FileUploadProgress[] = [];
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Complete some, fail some
      uploads = completeFileUpload(uploads, files[0]);
      uploads = failFileUpload(uploads, files[1], "Error");
      uploads = completeFileUpload(uploads, files[2]);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.uploading).toBe(2); // Remaining files still uploading
    });
  });
});
