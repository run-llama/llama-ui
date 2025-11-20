import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkUrl,
  downloadFile,
  getFileTypeInfo,
  resolveFileName,
} from "../../src/document-preview/files";

describe("getFileTypeInfo", () => {
  it("extracts mime type and extension from File object", () => {
    const file = new File(["dummy"], "report.pdf", {
      type: "application/pdf",
    });

    const result = getFileTypeInfo(file);

    expect(result).toEqual({
      mimeType: "application/pdf",
      extension: "pdf",
    });
  });

  it("extracts extension from File when mime type is missing", () => {
    const file = new File(["dummy"], "ledger.xlsx");

    const result = getFileTypeInfo(file);

    expect(result).toEqual({
      mimeType: null,
      extension: "xlsx",
    });
  });

  it("handles File with mime type but no extension in name", () => {
    const file = new File(["dummy"], "document", {
      type: "application/pdf",
    });

    const result = getFileTypeInfo(file);

    expect(result).toEqual({
      mimeType: "application/pdf",
      extension: null,
    });
  });

  it("normalizes mime type by removing parameters", () => {
    const file = new File(["dummy"], "file.pdf", {
      type: "application/pdf; charset=utf-8",
    });

    const result = getFileTypeInfo(file);

    expect(result.mimeType).toBe("application/pdf");
  });

  it("extracts mime type and extension from absolute URL", () => {
    const url = "https://example.com/document.pdf";

    const result = getFileTypeInfo(url);

    expect(result).toEqual({
      mimeType: null,
      extension: "pdf",
    });
  });

  it("extracts extension from URL with query parameters", () => {
    const url = "https://example.com/download/path/document.pdf?foo=bar";

    const result = getFileTypeInfo(url);

    expect(result).toEqual({
      mimeType: null,
      extension: "pdf",
    });
  });

  it("extracts mime type from data URL", () => {
    const dataUrl =
      "data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDExMyAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE3MQolJUVPRgo=";

    const result = getFileTypeInfo(dataUrl);

    expect(result).toEqual({
      mimeType: "application/pdf",
      extension: null,
    });
  });

  it("extracts mime type from data URL with text/plain", () => {
    const dataUrl = "data:text/plain;base64,SGVsbG8gV29ybGQ=";

    const result = getFileTypeInfo(dataUrl);

    expect(result).toEqual({
      mimeType: "text/plain",
      extension: null,
    });
  });

  it("handles URL with no extension", () => {
    const url = "https://example.com/path/to/file";

    const result = getFileTypeInfo(url);

    expect(result).toEqual({
      mimeType: null,
      extension: null,
    });
  });

  it("handles invalid URL string by extracting extension directly", () => {
    const url = "not-a-valid-url.xlsx";

    const result = getFileTypeInfo(url);

    expect(result).toEqual({
      mimeType: null,
      extension: "xlsx",
    });
  });

  it("handles case-insensitive extensions", () => {
    const file = new File(["dummy"], "document.PDF");

    const result = getFileTypeInfo(file);

    expect(result.extension).toBe("pdf");
  });

  it("handles URL with uppercase extension", () => {
    const url = "https://example.com/document.XLSX";

    const result = getFileTypeInfo(url);

    expect(result.extension).toBe("xlsx");
  });

  it("handles mime type with whitespace", () => {
    const file = new File(["dummy"], "file.pdf", {
      type: " application/pdf ",
    });

    const result = getFileTypeInfo(file);

    expect(result.mimeType).toBe("application/pdf");
  });

  it("returns null for both when File has no type and no name", () => {
    const file = new File(["dummy"], "");

    const result = getFileTypeInfo(file);

    expect(result).toEqual({
      mimeType: null,
      extension: null,
    });
  });

  it("handles URL with hash fragment", () => {
    const url = "https://example.com/document.pdf#section1";

    const result = getFileTypeInfo(url);

    expect(result.extension).toBe("pdf");
  });

  it("handles relative URL", () => {
    const url = "./document.pdf";

    const result = getFileTypeInfo(url);

    expect(result.extension).toBe("pdf");
  });

  it("extracts extension from S3 URL with filename in query parameter", () => {
    const url =
      "https://llama-platform-raw-files.s3.amazonaws.com/files/project_id%347hjfhfh-7b5f-4a66-a804-47238749/c47833-3169-424c-a703-342345abc?response-content-disposition=attachment%3B%20filename%3D%22CornCostReturn.xlsx%22";

    const result = getFileTypeInfo(url);

    expect(result.extension).toBe("xlsx");
  });
});

describe("resolveFileName", () => {
  it("returns file name from File object", () => {
    const file = new File(["dummy"], "document.pdf");

    const result = resolveFileName(file);

    expect(result).toBe("document.pdf");
  });

  it("returns file name from URL with filename in path", () => {
    const url = "https://example.com/path/to/document.pdf";

    const result = resolveFileName(url);

    expect(result).toBe("document.pdf");
  });

  it("returns file name from URL with encoded filename", () => {
    const url = "https://example.com/path/to/document%20with%20spaces.pdf";

    const result = resolveFileName(url);

    expect(result).toBe("document with spaces.pdf");
  });

  it("returns file name from URL with query parameters", () => {
    const url = "https://example.com/path/to/document.pdf?foo=bar&baz=qux";

    const result = resolveFileName(url);

    expect(result).toBe("document.pdf");
  });

  it("returns file name from URL with hash fragment", () => {
    const url = "https://example.com/path/to/document.pdf#section1";

    const result = resolveFileName(url);

    expect(result).toBe("document.pdf");
  });

  it("returns file name from URL with trailing slash", () => {
    const url = "https://example.com/path/to/document.pdf/";

    const result = resolveFileName(url);

    expect(result).toBe("document.pdf");
  });

  it("returns file name from URL with multiple path segments", () => {
    const url = "https://example.com/very/long/path/to/the/file.xlsx";

    const result = resolveFileName(url);

    expect(result).toBe("file.xlsx");
  });

  it("returns null for URL without filename in path", () => {
    const url = "https://example.com/path/to/";

    const result = resolveFileName(url);

    expect(result).toBeNull();
  });

  it("returns null for URL with only domain", () => {
    const url = "https://example.com";

    const result = resolveFileName(url);

    expect(result).toBeNull();
  });

  it("returns null for invalid URL string", () => {
    const url = "not-a-valid-url";

    const result = resolveFileName(url);

    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const url = "";

    const result = resolveFileName(url);

    expect(result).toBeNull();
  });

  it("handles URL with special characters in filename", () => {
    const url =
      "https://example.com/path/to/file%20name%20with%20%26%20symbols.pdf";

    const result = resolveFileName(url);

    expect(result).toBe("file name with & symbols.pdf");
  });

  it("handles URL with filename in root path", () => {
    const url = "https://example.com/filename.txt";

    const result = resolveFileName(url);

    expect(result).toBe("filename.txt");
  });
});

describe("checkUrl", () => {
  it("returns data URL as-is", () => {
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

    const result = checkUrl(dataUrl);

    expect(result).toBe(dataUrl);
  });

  it("returns absolute URL as-is", () => {
    const absoluteUrl = "https://example.com/image.png";

    const result = checkUrl(absoluteUrl);

    expect(result).toBe("https://example.com/image.png");
  });

  it("returns relative URL starting with / as-is", () => {
    const relativeUrl = "/image.png";

    const result = checkUrl(relativeUrl);

    expect(result).toBe("/image.png");
  });

  it("returns relative URL starting with ./ as-is", () => {
    const relativeUrl = "./image.png";

    const result = checkUrl(relativeUrl);

    expect(result).toBe("./image.png");
  });

  it("returns relative URL starting with ../ as-is", () => {
    const relativeUrl = "../image.png";

    const result = checkUrl(relativeUrl);

    expect(result).toBe("../image.png");
  });

  it("handles URL with query parameters", () => {
    const url = "https://example.com/image.png?foo=bar&baz=qux";

    const result = checkUrl(url);

    expect(result).toBe("https://example.com/image.png?foo=bar&baz=qux");
  });

  it("returns null for invalid URL that is not relative", () => {
    const invalidUrl = "not-a-valid-url";

    const result = checkUrl(invalidUrl);

    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const emptyUrl = "";

    const result = checkUrl(emptyUrl);

    expect(result).toBeNull();
  });
});

describe("downloadFile", () => {
  beforeEach(() => {
    // Clear the body before each test
    document.body.innerHTML = "";
  });

  afterEach(() => {
    // Clean up any remaining elements
    document.body.innerHTML = "";
    // Restore all mocks to prevent test pollution
    vi.restoreAllMocks();
  });

  it("clicks the link element", () => {
    const contentUrl = "https://example.com/document.pdf";
    const fileName = "document.pdf";
    const clickSpy = vi.fn();

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        element.click = clickSpy;
      }
      return element;
    });

    downloadFile(contentUrl, fileName);

    expect(clickSpy).toHaveBeenCalled();
  });
});
