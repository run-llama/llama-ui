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
 * Tests specifically for multi-file upload scenarios
 * These test the behavior when multiple files are uploaded simultaneously
 */

describe("Multi-File Upload Scenarios", () => {
  const createMockFile = (name: string, size?: number): File => {
    // Don't create huge arrays - just use small content and override size if needed
    const content = ["mock content"];
    const file = new File(content, name, { type: "application/pdf" });

    // Override the size property if specified (for testing purposes)
    if (size !== undefined) {
      Object.defineProperty(file, "size", {
        value: size,
        writable: false,
      });
    }

    return file;
  };

  describe("Batch File Upload", () => {
    it("should handle uploading 5 files simultaneously", () => {
      const files = [
        createMockFile("doc1.pdf"),
        createMockFile("doc2.pdf"),
        createMockFile("doc3.pdf"),
        createMockFile("doc4.pdf"),
        createMockFile("doc5.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Add all files to queue
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      expect(uploads).toHaveLength(5);
      expect(uploads.every((upload) => upload.status === "uploading")).toBe(
        true,
      );
      expect(uploads.every((upload) => upload.progress === 0)).toBe(true);
    });

    it("should handle different progress rates for different files", () => {
      const files = [
        createMockFile("fast.pdf"),
        createMockFile("medium.pdf"),
        createMockFile("slow.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Add files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate different upload speeds
      uploads = updateFileProgress(uploads, files[0], 90); // Fast
      uploads = updateFileProgress(uploads, files[1], 45); // Medium
      uploads = updateFileProgress(uploads, files[2], 10); // Slow

      const stats = calculateUploadStats(uploads);
      expect(stats.totalProgress).toBe(48); // (90 + 45 + 10) / 3 ≈ 48
      expect(stats.uploading).toBe(3);
      expect(stats.completed).toBe(0);
    });

    it("should handle files completing at different times", () => {
      const files = [
        createMockFile("first.pdf"),
        createMockFile("second.pdf"),
        createMockFile("third.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Add files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // First file completes
      uploads = updateFileProgress(uploads, files[0], 100);
      uploads = completeFileUpload(uploads, files[0]);

      // Second file is still uploading
      uploads = updateFileProgress(uploads, files[1], 60);

      // Third file completes
      uploads = updateFileProgress(uploads, files[2], 100);
      uploads = completeFileUpload(uploads, files[2]);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(2);
      expect(stats.uploading).toBe(1);
      expect(stats.totalProgress).toBe(87); // (100 + 60 + 100) / 3 ≈ 87
    });
  });

  describe("Multi-File Cancellation", () => {
    it("should cancel specific files while others continue", () => {
      const files = [
        createMockFile("keep1.pdf"),
        createMockFile("cancel1.pdf"),
        createMockFile("keep2.pdf"),
        createMockFile("cancel2.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Add files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Update progress
      uploads = updateFileProgress(uploads, files[0], 30);
      uploads = updateFileProgress(uploads, files[1], 50);
      uploads = updateFileProgress(uploads, files[2], 70);
      uploads = updateFileProgress(uploads, files[3], 20);

      // Cancel files 1 and 3 (index 1 and 3)
      uploads = cancelFileUpload(uploads, files[1]);
      uploads = cancelFileUpload(uploads, files[3]);

      const stats = calculateUploadStats(uploads);
      expect(stats.uploading).toBe(2); // files[0] and files[2]
      expect(stats.canceled).toBe(2); // files[1] and files[3]
      expect(stats.totalProgress).toBe(43); // (30 + 50 + 70 + 20) / 4 = 42.5 ≈ 43
    });

    it("should handle cancel all with large number of files", () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        createMockFile(`bulk${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Add all files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Complete first two files
      uploads = completeFileUpload(uploads, files[0]);
      uploads = completeFileUpload(uploads, files[1]);

      // Fail one file
      uploads = updateFileProgress(uploads, files[2], 40);
      uploads = uploads.map((upload) =>
        upload.file.name === files[2].name
          ? { ...upload, status: "error" as const, error: "Server error" }
          : upload,
      );

      // Cancel all remaining uploading files
      uploads = cancelAllUploads(uploads);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.canceled).toBe(7); // 10 - 2 - 1 = 7
      expect(stats.uploading).toBe(0);
    });
  });

  describe("File Queue Management", () => {
    it("should handle adding duplicate file names in batch", () => {
      const files = [
        createMockFile("document.pdf"), // First file
        createMockFile("report.pdf"),
        createMockFile("document.pdf"), // Duplicate name
      ];

      let uploads: FileUploadProgress[] = [];

      // Add files one by one
      uploads = addUploadToQueue(uploads, files[0]);
      uploads = updateFileProgress(uploads, files[0], 50);

      uploads = addUploadToQueue(uploads, files[1]);
      uploads = updateFileProgress(uploads, files[1], 30);

      // Adding duplicate should replace the first one
      uploads = addUploadToQueue(uploads, files[2]);

      expect(uploads).toHaveLength(2);
      expect(
        uploads.find((u) => u.file.name === "document.pdf")?.progress,
      ).toBe(0); // Reset
      expect(uploads.find((u) => u.file.name === "report.pdf")?.progress).toBe(
        30,
      ); // Unchanged
    });

    it("should handle mixed file types and sizes", () => {
      const files = [
        createMockFile("small.pdf", 100 * 1024), // 100KB
        createMockFile("medium.doc", 5 * 1000 * 1000), // 5MB
        createMockFile("large.zip", 50 * 1000 * 1000), // 50MB
      ];

      let uploads: FileUploadProgress[] = [];

      // Add files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate realistic upload speeds (smaller files upload faster)
      uploads = updateFileProgress(uploads, files[0], 100); // Small file completes quickly
      uploads = completeFileUpload(uploads, files[0]);

      uploads = updateFileProgress(uploads, files[1], 75); // Medium file progressing
      uploads = updateFileProgress(uploads, files[2], 25); // Large file slower

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(1);
      expect(stats.uploading).toBe(2);
      expect(stats.totalProgress).toBe(67); // (100 + 75 + 25) / 3 ≈ 67
    });
  });

  describe("Error Handling in Multi-File Upload", () => {
    it("should handle some files failing while others succeed", () => {
      const files = [
        createMockFile("success1.pdf"),
        createMockFile("fail1.pdf"),
        createMockFile("success2.pdf"),
        createMockFile("fail2.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Add files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Upload progress
      uploads = updateFileProgress(uploads, files[0], 100);
      uploads = completeFileUpload(uploads, files[0]);

      uploads = updateFileProgress(uploads, files[1], 60);
      uploads = uploads.map((upload) =>
        upload.file.name === files[1].name
          ? { ...upload, status: "error" as const, error: "Network timeout" }
          : upload,
      );

      uploads = updateFileProgress(uploads, files[2], 100);
      uploads = completeFileUpload(uploads, files[2]);

      uploads = updateFileProgress(uploads, files[3], 30);
      uploads = uploads.map((upload) =>
        upload.file.name === files[3].name
          ? { ...upload, status: "error" as const, error: "File corrupted" }
          : upload,
      );

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(2);
      expect(stats.uploading).toBe(0);
      expect(stats.totalProgress).toBe(73); // (100 + 60 + 100 + 30) / 4 = 72.5 ≈ 73
    });

    it("should handle network failure affecting all uploads", () => {
      const files = Array.from({ length: 5 }, (_, i) =>
        createMockFile(`file${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Add files and start uploads
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate partial progress
      uploads = updateFileProgress(uploads, files[0], 80);
      uploads = updateFileProgress(uploads, files[1], 60);
      uploads = updateFileProgress(uploads, files[2], 40);
      uploads = updateFileProgress(uploads, files[3], 20);
      uploads = updateFileProgress(uploads, files[4], 90);

      // Network fails - all uploading files should be marked as failed
      uploads = uploads.map((upload) =>
        upload.status === "uploading"
          ? {
              ...upload,
              status: "error" as const,
              error: "Network connection lost",
            }
          : upload,
      );

      const stats = calculateUploadStats(uploads);
      expect(stats.failed).toBe(5);
      expect(stats.uploading).toBe(0);
      expect(stats.totalProgress).toBe(58); // (80 + 60 + 40 + 20 + 90) / 5 = 58
    });
  });

  describe("Performance with Large File Counts", () => {
    it("should handle 20+ files efficiently", () => {
      const files = Array.from({ length: 25 }, (_, i) =>
        createMockFile(`batch${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Add all files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      expect(uploads).toHaveLength(25);
      expect(uploads.every((upload) => upload.status === "uploading")).toBe(
        true,
      );

      // Simulate various completion states
      // Complete 10 files
      for (let i = 0; i < 10; i++) {
        uploads = updateFileProgress(uploads, files[i], 100);
        uploads = completeFileUpload(uploads, files[i]);
      }

      // Fail 5 files
      for (let i = 10; i < 15; i++) {
        uploads = updateFileProgress(uploads, files[i], Math.random() * 80);
        uploads = uploads.map((upload) =>
          upload.file.name === files[i].name
            ? {
                ...upload,
                status: "error" as const,
                error: "Processing failed",
              }
            : upload,
        );
      }

      // Cancel remaining 10 files
      uploads = cancelAllUploads(uploads);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(10);
      expect(stats.failed).toBe(5);
      expect(stats.canceled).toBe(10);
      expect(stats.uploading).toBe(0);
      expect(stats.total).toBe(25);
    });

    it("should calculate correct statistics with many files", () => {
      const files = Array.from({ length: 50 }, (_, i) =>
        createMockFile(`file${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Add all files
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Set random progress for each file
      files.forEach((file) => {
        const progress = Math.floor(Math.random() * 100);
        uploads = updateFileProgress(uploads, file, progress);
      });

      const stats = calculateUploadStats(uploads);
      expect(stats.total).toBe(50);
      expect(stats.uploading).toBe(50);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.canceled).toBe(0);
      expect(stats.totalProgress).toBeGreaterThanOrEqual(0);
      expect(stats.totalProgress).toBeLessThanOrEqual(100);
    });
  });
});
