import { describe, it, expect } from "vitest";
import {
  addUploadToQueue,
  updateFileProgress,
  completeFileUpload,
  cancelFileUpload,
  cancelAllUploads,
  calculateUploadStats,
} from "./upload-progress-utils";
import type { FileUploadProgress } from "./upload-progress";

/**
 * Integration tests for common upload flow scenarios
 * These test the behavior of queue management, cancellation, and statistics
 */

describe("Upload Flow Integration Tests", () => {
  const createMockFile = (name: string): File => {
    return new File([""], name, { type: "application/pdf" });
  };

  describe("Queue Management Scenarios", () => {
    it("should handle adding multiple files to queue", () => {
      const files = [
        createMockFile("doc1.pdf"),
        createMockFile("doc2.pdf"),
        createMockFile("doc3.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Add files one by one
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      expect(uploads).toHaveLength(3);
      expect(uploads.every((upload) => upload.status === "uploading")).toBe(
        true,
      );
      expect(uploads.every((upload) => upload.progress === 0)).toBe(true);
    });

    it("should replace existing file in queue when same name uploaded", () => {
      const file1 = createMockFile("same-name.pdf");
      const file2 = createMockFile("same-name.pdf");

      let uploads: FileUploadProgress[] = [];

      // Add first file and update progress
      uploads = addUploadToQueue(uploads, file1);
      uploads = updateFileProgress(uploads, file1, 50);
      expect(uploads[0].progress).toBe(50);

      // Add second file with same name - should replace
      uploads = addUploadToQueue(uploads, file2);
      expect(uploads).toHaveLength(1);
      expect(uploads[0].progress).toBe(0); // Reset to 0
    });
  });

  describe("Cancel Functionality Scenarios", () => {
    it("should cancel individual file while keeping others intact", () => {
      const files = [
        createMockFile("keep-uploading.pdf"),
        createMockFile("cancel-me.pdf"),
        createMockFile("already-completed.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Add all files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Update progress and complete one
      uploads = updateFileProgress(uploads, files[0], 30);
      uploads = updateFileProgress(uploads, files[1], 60);
      uploads = completeFileUpload(uploads, files[2]);

      // Cancel the middle file
      uploads = cancelFileUpload(uploads, files[1]);

      expect(uploads[0]).toMatchObject({
        progress: 30,
        status: "uploading",
      });
      expect(uploads[1]).toMatchObject({
        progress: 60,
        status: "canceled",
      });
      expect(uploads[2]).toMatchObject({
        progress: 100,
        status: "completed",
      });
    });

    it("should cancel all uploading files but preserve completed/failed", () => {
      const files = [
        createMockFile("uploading1.pdf"),
        createMockFile("uploading2.pdf"),
        createMockFile("completed.pdf"),
        createMockFile("failed.pdf"),
        createMockFile("uploading3.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Add all files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Set different states
      uploads = updateFileProgress(uploads, files[0], 25); // uploading
      uploads = updateFileProgress(uploads, files[1], 75); // uploading
      uploads = completeFileUpload(uploads, files[2]); // completed
      uploads = updateFileProgress(uploads, files[3], 40);
      uploads = uploads.map((upload) =>
        upload.file.name === files[3].name
          ? { ...upload, status: "error" as const, error: "Network error" }
          : upload,
      ); // failed
      uploads = updateFileProgress(uploads, files[4], 10); // uploading

      // Cancel all
      uploads = cancelAllUploads(uploads);

      const stats = calculateUploadStats(uploads);
      expect(stats.uploading).toBe(0); // All uploading files should be canceled
      expect(stats.canceled).toBe(3); // files[0], files[1], files[4]
      expect(stats.completed).toBe(1); // files[2] should remain completed
      expect(stats.failed).toBe(1); // files[3] should remain failed
    });
  });

  describe("Progress Tracking Scenarios", () => {
    it("should track progress correctly across multiple files", () => {
      const files = [
        createMockFile("slow.pdf"), // 20%
        createMockFile("medium.pdf"), // 60%
        createMockFile("fast.pdf"), // 100%
      ];

      let uploads: FileUploadProgress[] = [];

      // Add files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Update progress
      uploads = updateFileProgress(uploads, files[0], 20);
      uploads = updateFileProgress(uploads, files[1], 60);
      uploads = completeFileUpload(uploads, files[2]);

      const stats = calculateUploadStats(uploads);
      expect(stats.totalProgress).toBe(60); // (20 + 60 + 100) / 3 = 60
      expect(stats.uploading).toBe(2);
      expect(stats.completed).toBe(1);
    });

    it("should cap progress at 100%", () => {
      const file = createMockFile("test.pdf");
      let uploads = addUploadToQueue([], file);

      uploads = updateFileProgress(uploads, file, 150); // Over 100%
      expect(uploads[0].progress).toBe(100);
    });
  });

  describe("Statistics Calculation Scenarios", () => {
    it("should calculate correct statistics for mixed upload states", () => {
      const files = [
        createMockFile("upload1.pdf"), // uploading - 30%
        createMockFile("upload2.pdf"), // uploading - 70%
        createMockFile("done1.pdf"), // completed - 100%
        createMockFile("done2.pdf"), // completed - 100%
        createMockFile("failed1.pdf"), // error - 45%
        createMockFile("cancel1.pdf"), // canceled - 20%
      ];

      let uploads: FileUploadProgress[] = [];

      // Add all files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Set up different states
      uploads = updateFileProgress(uploads, files[0], 30);
      uploads = updateFileProgress(uploads, files[1], 70);
      uploads = completeFileUpload(uploads, files[2]);
      uploads = completeFileUpload(uploads, files[3]);
      uploads = updateFileProgress(uploads, files[4], 45);
      uploads = uploads.map((upload) =>
        upload.file.name === files[4].name
          ? { ...upload, status: "error" as const, error: "Failed" }
          : upload,
      );
      uploads = updateFileProgress(uploads, files[5], 20);
      uploads = cancelFileUpload(uploads, files[5]);

      const stats = calculateUploadStats(uploads);

      expect(stats).toEqual({
        total: 6,
        uploading: 2,
        completed: 2,
        failed: 1,
        canceled: 1,
        totalProgress: Math.round((30 + 70 + 100 + 100 + 45 + 20) / 6), // 60.83... -> 61
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

  describe("Real-world Upload Flow Scenarios", () => {
    it("should simulate typical multi-file upload with some cancellations", () => {
      // Simulate user uploading 5 documents
      const files = Array.from({ length: 5 }, (_, i) =>
        createMockFile(`document-${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Step 1: User selects and starts uploading all files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });
      expect(uploads).toHaveLength(5);

      // Step 2: Files start uploading at different speeds
      uploads = updateFileProgress(uploads, files[0], 10);
      uploads = updateFileProgress(uploads, files[1], 25);
      uploads = updateFileProgress(uploads, files[2], 5);
      uploads = updateFileProgress(uploads, files[3], 40);
      uploads = updateFileProgress(uploads, files[4], 60);

      // Step 3: User decides to cancel the slow files (first 3)
      uploads = cancelFileUpload(uploads, files[0]);
      uploads = cancelFileUpload(uploads, files[1]);
      uploads = cancelFileUpload(uploads, files[2]);

      // Step 4: Remaining files continue and complete
      uploads = updateFileProgress(uploads, files[3], 100);
      uploads = completeFileUpload(uploads, files[3]);
      uploads = updateFileProgress(uploads, files[4], 100);
      uploads = completeFileUpload(uploads, files[4]);

      // Verify final state
      const stats = calculateUploadStats(uploads);
      expect(stats.canceled).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.uploading).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it("should simulate network issues and recovery", () => {
      const file = createMockFile("unreliable-network.pdf");
      let uploads = addUploadToQueue([], file);

      // Start upload
      uploads = updateFileProgress(uploads, file, 30);

      // Network fails
      uploads = uploads.map((upload) => ({
        ...upload,
        status: "error" as const,
        error: "Network timeout",
      }));

      // User retries - add same file again (simulates retry)
      uploads = addUploadToQueue(uploads, file);

      // This time it succeeds
      uploads = updateFileProgress(uploads, file, 50);
      uploads = updateFileProgress(uploads, file, 100);
      uploads = completeFileUpload(uploads, file);

      // Should have only one upload (the successful retry)
      expect(uploads).toHaveLength(1);
      expect(uploads[0].status).toBe("completed");
    });

    it("should handle cancel all during mixed upload states", () => {
      const files = Array.from({ length: 8 }, (_, i) =>
        createMockFile(`bulk-upload-${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Add all files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate various progress states
      uploads = updateFileProgress(uploads, files[0], 90); // Almost done
      uploads = completeFileUpload(uploads, files[1]); // Completed
      uploads = updateFileProgress(uploads, files[2], 50); // Half way
      uploads = uploads.map((upload) =>
        upload.file.name === files[3].name
          ? { ...upload, status: "error" as const, error: "Server error" }
          : upload,
      ); // Failed
      // files[4-7] remain at 0% uploading

      // User clicks "Cancel All"
      uploads = cancelAllUploads(uploads);

      const stats = calculateUploadStats(uploads);
      expect(stats.canceled).toBe(6); // files[0], files[2], files[4-7] (6 files total)
      expect(stats.completed).toBe(1); // files[1] stays completed
      expect(stats.failed).toBe(1); // files[3] stays failed
      expect(stats.uploading).toBe(0); // All uploading files canceled
    });
  });
});
