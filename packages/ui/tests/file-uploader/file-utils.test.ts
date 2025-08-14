import { describe, it, expect, vi } from "vitest";
import {
  validateFile,
  formatFileSize,
  isFileApiSupported,
  isCryptoSupported,
  FileType,
  getFileTypeDefinition,
  getFileExtensions,
  getFileMimeTypes,
  isFileTypeMatch,
  FILE_TYPE_GROUPS,
  getFileTypesByCategory,
  createFileTypeValidator,
} from "@/src/file-uploader/file-utils";

// Mock crypto.subtle for testing
const mockCrypto = {
  subtle: {
    digest: vi.fn(),
  },
};

// Mock global crypto
Object.defineProperty(globalThis, "crypto", {
  value: mockCrypto,
  writable: true,
});

// Mock FileReader
class MockFileReader {
  result: ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;

  readAsArrayBuffer(file: File) {
    // Simulate successful read
    setTimeout(() => {
      this.result = new ArrayBuffer(file.size);
      this.onload?.call(
        this as unknown as FileReader,
        {} as ProgressEvent<FileReader>
      );
    }, 0);
  }
}

Object.defineProperty(globalThis, "FileReader", {
  value: MockFileReader,
  writable: true,
});

describe("validateFile", () => {
  const createMockFile = (
    name: string,
    size: number,
    type: string = "text/plain"
  ): File => {
    const file = new File([""], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("should return null for valid file", () => {
    const file = createMockFile("test.txt", 1024);
    const result = validateFile(file);
    expect(result).toBeNull();
  });

  it("should return error for file exceeding size limit", () => {
    const file = createMockFile("large.txt", 20 * 1000 * 1000); // 20MB
    const result = validateFile(file, [], 10 * 1000 * 1000); // 10MB limit
    expect(result).toContain("File size exceeds 10MB limit");
  });

  it("should validate file extensions correctly with FileType enum", () => {
    const pdfFile = createMockFile("document.pdf", 1024, "application/pdf");
    const txtFile = createMockFile("document.txt", 1024, "text/plain");

    // Allow only PDF using enum
    expect(validateFile(pdfFile, [FileType.PDF])).toBeNull();
    expect(validateFile(txtFile, [FileType.PDF])).toContain(
      "File type not allowed"
    );
  });

  it("should validate MIME types correctly with FileType enum", () => {
    const pdfFile = createMockFile("document.pdf", 1024, "application/pdf");
    const txtFile = createMockFile("document.txt", 1024, "text/plain");

    // Allow only PDF using enum (should match MIME type)
    expect(validateFile(pdfFile, [FileType.PDF])).toBeNull();
    expect(validateFile(txtFile, [FileType.PDF])).toContain(
      "File type not allowed"
    );
  });

  it("should handle multiple FileType enum validation", () => {
    const pdfFile = createMockFile("document.pdf", 1024, "application/pdf");
    const txtFile = createMockFile("document.txt", 1024, "text/plain");

    // Allow PDF and TXT file types
    expect(validateFile(pdfFile, [FileType.PDF, FileType.TXT])).toBeNull();
    expect(validateFile(txtFile, [FileType.PDF, FileType.TXT])).toBeNull();
  });

  it("should return null when no file type restrictions", () => {
    const file = createMockFile("anything.xyz", 1024, "application/unknown");
    expect(validateFile(file, [])).toBeNull();
  });
});

describe("formatFileSize", () => {
  it("should format bytes correctly", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(512)).toBe("512 Bytes");
    expect(formatFileSize(999)).toBe("999 Bytes");
  });

  it("should format KB correctly using decimal (SI) units", () => {
    expect(formatFileSize(1000)).toBe("1 KB");
    expect(formatFileSize(1500)).toBe("1.5 KB");
    expect(formatFileSize(2000)).toBe("2 KB");
    expect(formatFileSize(1024)).toBe("1.02 KB"); // 1024 bytes = 1.024 KB in decimal
  });

  it("should format MB correctly using decimal (SI) units", () => {
    expect(formatFileSize(1000 * 1000)).toBe("1 MB");
    expect(formatFileSize(1.5 * 1000 * 1000)).toBe("1.5 MB");
    expect(formatFileSize(10 * 1000 * 1000)).toBe("10 MB");
    expect(formatFileSize(1024 * 1024)).toBe("1.05 MB"); // 1048576 bytes = 1.048576 MB in decimal
  });

  it("should format GB correctly using decimal (SI) units", () => {
    expect(formatFileSize(1000 * 1000 * 1000)).toBe("1 GB");
    expect(formatFileSize(2.5 * 1000 * 1000 * 1000)).toBe("2.5 GB");
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.07 GB"); // 1073741824 bytes = 1.073741824 GB in decimal
  });
});

describe("isFileApiSupported", () => {
  it("should return true when File and FileReader are available", () => {
    expect(isFileApiSupported()).toBe(true);
  });

  it("should return false when File is not available", () => {
    const originalFile = globalThis.File;
    // @ts-expect-error - temporarily delete File for testing
    delete globalThis.File;

    expect(isFileApiSupported()).toBe(false);

    // Restore
    globalThis.File = originalFile;
  });

  it("should return false when FileReader is not available", () => {
    const originalFileReader = globalThis.FileReader;
    // @ts-expect-error - temporarily delete FileReader for testing
    delete globalThis.FileReader;

    expect(isFileApiSupported()).toBe(false);

    // Restore
    globalThis.FileReader = originalFileReader;
  });
});

describe("isCryptoSupported", () => {
  it("should return true when crypto.subtle is available", () => {
    expect(isCryptoSupported()).toBe(true);
  });

  it("should return false when crypto is not available", () => {
    const originalCrypto = globalThis.crypto;
    // @ts-expect-error - temporarily delete crypto for testing
    delete globalThis.crypto;

    expect(isCryptoSupported()).toBe(false);

    // Restore
    globalThis.crypto = originalCrypto;
  });

  it("should return false when crypto.subtle is not available", () => {
    const originalCrypto = globalThis.crypto;
    // @ts-expect-error - temporarily replace crypto for testing
    globalThis.crypto = {};

    expect(isCryptoSupported()).toBe(false);

    // Restore
    globalThis.crypto = originalCrypto;
  });
});

describe("Enhanced FileType validation", () => {
  const createMockFile = (
    name: string,
    size: number,
    type: string = "text/plain"
  ): File => {
    const file = new File([""], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("should handle JPEG variations correctly", () => {
    const jpegFile1 = createMockFile("image.jpg", 1024, "image/jpeg");
    const jpegFile2 = createMockFile("image.jpeg", 1024, "image/jpg");
    const jpegFile3 = createMockFile("image.JPG", 1024, "image/jpeg");
    const pngFile = createMockFile("image.png", 1024, "image/png");

    // Test basic functionality

    // Both JPEG and JPG enums should work for all variations
    expect(validateFile(jpegFile1, [FileType.JPEG])).toBeNull();
    expect(validateFile(jpegFile2, [FileType.JPEG])).toBeNull();
    expect(validateFile(jpegFile3, [FileType.JPEG])).toBeNull();
    expect(validateFile(jpegFile1, [FileType.JPG])).toBeNull();
    expect(validateFile(jpegFile2, [FileType.JPG])).toBeNull();
    expect(validateFile(jpegFile3, [FileType.JPG])).toBeNull();

    // PNG should not match JPEG types
    expect(validateFile(pngFile, [FileType.JPEG])).toContain(
      "File type not allowed"
    );
    expect(validateFile(pngFile, [FileType.JPG])).toContain(
      "File type not allowed"
    );
  });

  it("should provide readable error messages with FileType enum", () => {
    const txtFile = createMockFile("document.txt", 1024, "text/plain");

    const result = validateFile(txtFile, [FileType.PDF, FileType.DOCX]);
    expect(result).toContain("PDF Document, Word Document");
  });

  it("should validate file extensions correctly with FileType enum", () => {
    const pdfFile = createMockFile("document.pdf", 1024, "application/pdf");
    const txtFile = createMockFile("document.txt", 1024, "text/plain");

    // Allow only PDF using enum
    expect(validateFile(pdfFile, [FileType.PDF])).toBeNull();
    expect(validateFile(txtFile, [FileType.PDF])).toContain(
      "File type not allowed"
    );
  });

  it("should validate MIME types correctly with FileType enum", () => {
    const pdfFile = createMockFile("document.pdf", 1024, "application/pdf");
    const txtFile = createMockFile("document.txt", 1024, "text/plain");

    // Allow only PDF using enum (should match MIME type)
    expect(validateFile(pdfFile, [FileType.PDF])).toBeNull();
    expect(validateFile(txtFile, [FileType.PDF])).toContain(
      "File type not allowed"
    );
  });

  it("should handle document file type group validation", () => {
    const pdfFile = createMockFile("document.pdf", 1024, "application/pdf");
    const docxFile = createMockFile(
      "document.docx",
      1024,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    const txtFile = createMockFile("document.txt", 1024, "text/plain");

    // Allow all document types
    expect(validateFile(pdfFile, FILE_TYPE_GROUPS.DOCUMENTS)).toBeNull();
    expect(validateFile(docxFile, FILE_TYPE_GROUPS.DOCUMENTS)).toBeNull();
    expect(validateFile(txtFile, FILE_TYPE_GROUPS.DOCUMENTS)).toContain(
      "File type not allowed"
    );
  });
});

describe("FileType utility functions", () => {
  it("should get file type definition correctly", () => {
    const pdfDef = getFileTypeDefinition(FileType.PDF);
    expect(pdfDef.extensions).toEqual(["pdf"]);
    expect(pdfDef.mimeTypes).toEqual(["application/pdf"]);
    expect(pdfDef.displayName).toBe("PDF Document");
    expect(pdfDef.category).toBe("document");
  });

  it("should get file extensions correctly", () => {
    expect(getFileExtensions(FileType.JPEG)).toEqual(["jpg", "jpeg"]);
    expect(getFileExtensions(FileType.PNG)).toEqual(["png"]);
    expect(getFileExtensions(FileType.WEBP)).toEqual(["webp"]);
  });

  it("should get file MIME types correctly", () => {
    expect(getFileMimeTypes(FileType.JPEG)).toEqual([
      "image/jpeg",
      "image/jpg",
    ]);
    expect(getFileMimeTypes(FileType.PDF)).toEqual(["application/pdf"]);
    expect(getFileMimeTypes(FileType.XML)).toEqual([
      "application/xml",
      "text/xml",
    ]);
  });

  it("should match file types correctly by extension", () => {
    const jpegFile = new File([""], "test.jpg", { type: "" });
    const pdfFile = new File([""], "test.pdf", { type: "" });
    const unknownFile = new File([""], "test.xyz", { type: "" });

    expect(isFileTypeMatch(jpegFile, FileType.JPEG)).toBe(true);
    expect(isFileTypeMatch(jpegFile, FileType.JPG)).toBe(true);
    expect(isFileTypeMatch(pdfFile, FileType.PDF)).toBe(true);
    expect(isFileTypeMatch(unknownFile, FileType.PDF)).toBe(false);
  });

  it("should match file types correctly by MIME type", () => {
    const jpegFile = new File([""], "test", { type: "image/jpeg" });
    const pdfFile = new File([""], "test", { type: "application/pdf" });
    const unknownFile = new File([""], "test", { type: "application/unknown" });

    expect(isFileTypeMatch(jpegFile, FileType.JPEG)).toBe(true);
    expect(isFileTypeMatch(jpegFile, FileType.JPG)).toBe(true);
    expect(isFileTypeMatch(pdfFile, FileType.PDF)).toBe(true);
    expect(isFileTypeMatch(unknownFile, FileType.PDF)).toBe(false);
  });

  it("should handle case-insensitive extension matching", () => {
    const upperCaseFile = new File([""], "test.PDF", { type: "" });
    const mixedCaseFile = new File([""], "test.JpEg", { type: "" });

    expect(isFileTypeMatch(upperCaseFile, FileType.PDF)).toBe(true);
    expect(isFileTypeMatch(mixedCaseFile, FileType.JPEG)).toBe(true);
  });

  it("should provide predefined file type groups", () => {
    expect(FILE_TYPE_GROUPS.IMAGES).toContain(FileType.JPEG);
    expect(FILE_TYPE_GROUPS.IMAGES).toContain(FileType.PNG);
    expect(FILE_TYPE_GROUPS.IMAGES).toContain(FileType.WEBP);
    expect(FILE_TYPE_GROUPS.DOCUMENTS).toContain(FileType.PDF);
    expect(FILE_TYPE_GROUPS.DOCUMENTS).toContain(FileType.DOCX);
    expect(FILE_TYPE_GROUPS.TEXT).toContain(FileType.TXT);
    expect(FILE_TYPE_GROUPS.TEXT).toContain(FileType.JSON);
  });

  it("should get file types by category", () => {
    const imageTypes = getFileTypesByCategory("image");
    const documentTypes = getFileTypesByCategory("document");
    const textTypes = getFileTypesByCategory("text");

    expect(imageTypes).toContain(FileType.JPEG);
    expect(imageTypes).toContain(FileType.PNG);
    expect(documentTypes).toContain(FileType.PDF);
    expect(documentTypes).toContain(FileType.DOCX);
    expect(textTypes).toContain(FileType.TXT);
    expect(textTypes).toContain(FileType.JSON);
  });

  it("should create file type validators", () => {
    const imageValidator = createFileTypeValidator([
      ...FILE_TYPE_GROUPS.IMAGES,
    ]);
    const documentValidator = createFileTypeValidator(
      [...FILE_TYPE_GROUPS.DOCUMENTS],
      5 * 1000 * 1000
    );

    const jpegFile = new File([""], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(jpegFile, "size", { value: 1000 });

    const pdfFile = new File([""], "test.pdf", { type: "application/pdf" });
    Object.defineProperty(pdfFile, "size", { value: 1000 });

    expect(imageValidator(jpegFile)).toBeNull();
    expect(imageValidator(pdfFile)).toContain("File type not allowed");
    expect(documentValidator(pdfFile)).toBeNull();
    expect(documentValidator(jpegFile)).toContain("File type not allowed");
  });

  it("should only include document parsing relevant file types", () => {
    // Verify no audio, video, or archive types exist
    const allFileTypes = Object.values(FileType);

    // Audio file extensions that should NOT exist
    expect(allFileTypes).not.toContain("mp3");
    expect(allFileTypes).not.toContain("wav");
    expect(allFileTypes).not.toContain("aac");

    // Video file extensions that should NOT exist
    expect(allFileTypes).not.toContain("mp4");
    expect(allFileTypes).not.toContain("avi");
    expect(allFileTypes).not.toContain("mov");

    // Archive file extensions that should NOT exist
    expect(allFileTypes).not.toContain("zip");
    expect(allFileTypes).not.toContain("rar");
    expect(allFileTypes).not.toContain("7z");

    // Removed image formats should not exist
    expect(allFileTypes).not.toContain("ico");
    expect(allFileTypes).not.toContain("gif");
    expect(allFileTypes).not.toContain("svg");
    expect(allFileTypes).not.toContain("bmp");
    expect(allFileTypes).not.toContain("tiff");

    // Removed document formats should not exist
    expect(allFileTypes).not.toContain("rtf");
    expect(allFileTypes).not.toContain("odt");
    expect(allFileTypes).not.toContain("ods");
    expect(allFileTypes).not.toContain("odp");

    // But document processing relevant types should exist
    expect(allFileTypes).toContain("pdf");
    expect(allFileTypes).toContain("docx");
    expect(allFileTypes).toContain("jpeg");
    expect(allFileTypes).toContain("jpg");
    expect(allFileTypes).toContain("png");
    expect(allFileTypes).toContain("webp");
    expect(allFileTypes).toContain("txt");
  });
});
