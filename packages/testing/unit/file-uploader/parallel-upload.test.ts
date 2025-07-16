import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  addUploadToQueue,
  updateFileProgress,
  completeFileUpload,
  failFileUpload,
  calculateUploadStats,
} from "@llamaindex/ui/registry/new-york/file-uploader/upload-progress-utils";
import type { FileUploadProgress } from "@llamaindex/ui/registry/new-york/file-uploader/upload-progress";

/**
 * Tests for parallel upload behavior
 * These tests verify that multiple files can be uploaded simultaneously
 */

describe("Parallel Upload Scenarios", () => {
  const createMockFile = (name: string): File => {
    return new File([""], name, { type: "application/pdf" });
  };

  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Concurrent Upload Simulation", () => {
    it("should handle multiple files starting upload simultaneously", () => {
      const files = [
        createMockFile("file1.pdf"),
        createMockFile("file2.pdf"),
        createMockFile("file3.pdf"),
        createMockFile("file4.pdf"),
        createMockFile("file5.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Simulate all files starting upload at the same time (parallel)
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // All files should be in uploading state
      expect(uploads).toHaveLength(5);
      expect(uploads.every((upload) => upload.status === "uploading")).toBe(
        true,
      );
      expect(uploads.every((upload) => upload.progress === 0)).toBe(true);

      const stats = calculateUploadStats(uploads);
      expect(stats.uploading).toBe(5);
      expect(stats.totalProgress).toBe(0);
    });

    it("should handle concurrent progress updates", () => {
      const files = [
        createMockFile("fast.pdf"),
        createMockFile("medium.pdf"),
        createMockFile("slow.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Start all uploads
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate concurrent progress at different rates
      // Fast file progresses quickly
      uploads = updateFileProgress(uploads, files[0], 20);
      uploads = updateFileProgress(uploads, files[0], 40);
      uploads = updateFileProgress(uploads, files[0], 60);
      uploads = updateFileProgress(uploads, files[0], 80);
      uploads = updateFileProgress(uploads, files[0], 100);
      uploads = completeFileUpload(uploads, files[0]);

      // Medium file progresses moderately
      uploads = updateFileProgress(uploads, files[1], 15);
      uploads = updateFileProgress(uploads, files[1], 35);
      uploads = updateFileProgress(uploads, files[1], 55);

      // Slow file progresses slowly
      uploads = updateFileProgress(uploads, files[2], 5);
      uploads = updateFileProgress(uploads, files[2], 12);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(1); // Fast file completed
      expect(stats.uploading).toBe(2); // Medium and slow still uploading
      expect(stats.totalProgress).toBe(56); // (100 + 55 + 12) / 3 ≈ 56
    });

    it("should handle mixed completion timing in parallel uploads", () => {
      const files = Array.from({ length: 8 }, (_, i) =>
        createMockFile(`file${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Start all uploads in parallel
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate realistic parallel upload scenario
      // Some files complete quickly (small files)
      uploads = updateFileProgress(uploads, files[0], 100);
      uploads = completeFileUpload(uploads, files[0]);
      uploads = updateFileProgress(uploads, files[1], 100);
      uploads = completeFileUpload(uploads, files[1]);

      // Some files fail due to network issues
      uploads = updateFileProgress(uploads, files[2], 45);
      uploads = failFileUpload(uploads, files[2], "Network timeout");
      uploads = updateFileProgress(uploads, files[3], 30);
      uploads = failFileUpload(uploads, files[3], "Server error");

      // Some files are still uploading at various stages
      uploads = updateFileProgress(uploads, files[4], 75);
      uploads = updateFileProgress(uploads, files[5], 60);
      uploads = updateFileProgress(uploads, files[6], 40);
      uploads = updateFileProgress(uploads, files[7], 20);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(2);
      expect(stats.uploading).toBe(4);
      expect(stats.totalProgress).toBe(59); // (100+100+45+30+75+60+40+20)/8 = 58.75 ≈ 59
    });
  });

  describe("Parallel Upload Error Handling", () => {
    it("should handle partial failures in parallel uploads", () => {
      const files = [
        createMockFile("success1.pdf"),
        createMockFile("success2.pdf"),
        createMockFile("fail1.pdf"),
        createMockFile("fail2.pdf"),
        createMockFile("pending1.pdf"),
        createMockFile("pending2.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Start all uploads
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate concurrent upload outcomes
      // Two files succeed
      uploads = updateFileProgress(uploads, files[0], 100);
      uploads = completeFileUpload(uploads, files[0]);
      uploads = updateFileProgress(uploads, files[1], 100);
      uploads = completeFileUpload(uploads, files[1]);

      // Two files fail
      uploads = updateFileProgress(uploads, files[2], 60);
      uploads = failFileUpload(uploads, files[2], "Authentication failed");
      uploads = updateFileProgress(uploads, files[3], 25);
      uploads = failFileUpload(uploads, files[3], "File corrupted");

      // Two files still uploading
      uploads = updateFileProgress(uploads, files[4], 80);
      uploads = updateFileProgress(uploads, files[5], 45);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(2);
      expect(stats.uploading).toBe(2);
      expect(stats.total).toBe(6);
    });

    it("should handle network interruption affecting some parallel uploads", () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        createMockFile(`batch${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Start all uploads
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Some files complete before network issue
      uploads = updateFileProgress(uploads, files[0], 100);
      uploads = completeFileUpload(uploads, files[0]);
      uploads = updateFileProgress(uploads, files[1], 100);
      uploads = completeFileUpload(uploads, files[1]);

      // Network interruption affects remaining uploads differently
      // Some were already at high progress and can complete
      uploads = updateFileProgress(uploads, files[2], 95);
      uploads = updateFileProgress(uploads, files[3], 90);

      // Some fail due to network interruption
      uploads = updateFileProgress(uploads, files[4], 50);
      uploads = failFileUpload(uploads, files[4], "Network disconnected");
      uploads = updateFileProgress(uploads, files[5], 30);
      uploads = failFileUpload(uploads, files[5], "Connection lost");

      // Some are still trying to upload
      uploads = updateFileProgress(uploads, files[6], 70);
      uploads = updateFileProgress(uploads, files[7], 40);
      uploads = updateFileProgress(uploads, files[8], 20);
      uploads = updateFileProgress(uploads, files[9], 10);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(2);
      expect(stats.uploading).toBe(6);
      expect(stats.totalProgress).toBe(61); // Sum of all progress / 10
    });
  });

  describe("Performance with Parallel Uploads", () => {
    it("should efficiently track large number of concurrent uploads", () => {
      const files = Array.from({ length: 20 }, (_, i) =>
        createMockFile(`concurrent${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Start all 20 uploads simultaneously
      const startTime = Date.now();
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });
      const addTime = Date.now() - startTime;

      // Should be fast to add all files
      expect(addTime).toBeLessThan(100); // Should take less than 100ms
      expect(uploads).toHaveLength(20);

      // Simulate rapid progress updates (as would happen in parallel)
      const progressStartTime = Date.now();
      files.forEach((file, index) => {
        const progress = Math.min(95, (index + 1) * 5); // Staggered progress
        uploads = updateFileProgress(uploads, file, progress);
      });
      const progressTime = Date.now() - progressStartTime;

      // Progress updates should also be fast
      expect(progressTime).toBeLessThan(100);

      const stats = calculateUploadStats(uploads);
      expect(stats.uploading).toBe(20);
      expect(stats.totalProgress).toBeGreaterThan(0);
    });

    it("should handle rapid state changes in parallel uploads", () => {
      const files = [
        createMockFile("rapid1.pdf"),
        createMockFile("rapid2.pdf"),
        createMockFile("rapid3.pdf"),
      ];

      let uploads: FileUploadProgress[] = [];

      // Start uploads
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate rapid state changes that could happen in parallel
      for (let i = 0; i <= 100; i += 10) {
        uploads = updateFileProgress(uploads, files[0], i);
        if (i >= 30) uploads = updateFileProgress(uploads, files[1], i - 20);
        if (i >= 50) uploads = updateFileProgress(uploads, files[2], i - 40);
      }

      // Complete in different order (as would happen in parallel)
      uploads = completeFileUpload(uploads, files[1]); // Second file completes first
      uploads = completeFileUpload(uploads, files[0]); // First file completes second
      uploads = completeFileUpload(uploads, files[2]); // Third file completes last

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(3);
      expect(stats.uploading).toBe(0);
      expect(stats.totalProgress).toBe(100);
    });
  });

  describe("Real-world Parallel Upload Scenarios", () => {
    it("should simulate realistic mixed file sizes uploading in parallel", () => {
      const files = [
        createMockFile("small-image.jpg"), // Small file - completes quickly
        createMockFile("medium-doc.pdf"), // Medium file - moderate speed
        createMockFile("large-video.mp4"), // Large file - slow
        createMockFile("tiny-text.txt"), // Tiny file - instant
        createMockFile("medium-presentation.pptx"), // Medium file
      ];

      let uploads: FileUploadProgress[] = [];

      // All files start uploading simultaneously
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Simulate realistic upload progression based on file sizes
      // Tiny file completes almost instantly
      uploads = updateFileProgress(uploads, files[3], 100);
      uploads = completeFileUpload(uploads, files[3]);

      // Small file progresses quickly
      uploads = updateFileProgress(uploads, files[0], 80);
      uploads = updateFileProgress(uploads, files[0], 100);
      uploads = completeFileUpload(uploads, files[0]);

      // Medium files progress moderately
      uploads = updateFileProgress(uploads, files[1], 45);
      uploads = updateFileProgress(uploads, files[4], 40);

      // Large file progresses slowly
      uploads = updateFileProgress(uploads, files[2], 15);

      // Continue medium file progress
      uploads = updateFileProgress(uploads, files[1], 70);
      uploads = updateFileProgress(uploads, files[4], 65);

      // Large file continues slowly
      uploads = updateFileProgress(uploads, files[2], 25);

      // One medium file completes
      uploads = updateFileProgress(uploads, files[1], 100);
      uploads = completeFileUpload(uploads, files[1]);

      const stats = calculateUploadStats(uploads);
      expect(stats.completed).toBe(3); // tiny, small, one medium
      expect(stats.uploading).toBe(2); // large file and other medium file
      expect(stats.totalProgress).toBe(78); // (100+100+100+65+25)/5 = 78
    });

    it("should handle user canceling some uploads while others continue", () => {
      const files = Array.from({ length: 6 }, (_, i) =>
        createMockFile(`upload${i + 1}.pdf`),
      );

      let uploads: FileUploadProgress[] = [];

      // Start all uploads
      files.forEach((file) => {
        uploads = addUploadToQueue(uploads, file);
      });

      // Some progress on all files
      uploads = updateFileProgress(uploads, files[0], 30);
      uploads = updateFileProgress(uploads, files[1], 45);
      uploads = updateFileProgress(uploads, files[2], 60);
      uploads = updateFileProgress(uploads, files[3], 25);
      uploads = updateFileProgress(uploads, files[4], 80);
      uploads = updateFileProgress(uploads, files[5], 35);

      // User cancels some uploads (files 1, 3, 5 - index 1, 3, 5)
      uploads = uploads.map((upload) =>
        (upload.file.name === files[1].name ||
          upload.file.name === files[3].name ||
          upload.file.name === files[5].name) &&
        upload.status === "uploading"
          ? { ...upload, status: "canceled" as const }
          : upload,
      );

      // Remaining files continue uploading
      uploads = updateFileProgress(uploads, files[0], 60);
      uploads = updateFileProgress(uploads, files[2], 90);
      uploads = updateFileProgress(uploads, files[4], 100);
      uploads = completeFileUpload(uploads, files[4]);

      const stats = calculateUploadStats(uploads);
      expect(stats.uploading).toBe(2); // files[0] and files[2]
      expect(stats.completed).toBe(1); // files[4]
      expect(stats.canceled).toBe(3); // files[1], files[3], files[5]
    });
  });
});
