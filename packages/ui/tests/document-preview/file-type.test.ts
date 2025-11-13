import { describe, expect, it } from "vitest";

import {
  checkUrl,
  determinePreviewType,
  resolveFileName,
} from "../../src/document-preview/file-type";

describe("determinePreviewType", () => {
  it("returns mapped preview when mime type matches", () => {
    const file = new File(["dummy"], "report.pdf", {
      type: "application/pdf",
    });

    const result = determinePreviewType(file);

    expect(result).toBe("pdf");
  });

  it("returns sheet when URL has xls extension", () => {
    const url = "https://example.com/path/to/budget.XLS";

    const result = determinePreviewType(url);

    expect(result).toBe("sheet");
  });

  it("uses the File name when mime type is unavailable", () => {
    const file = new File(["dummy"], "ledger.xlsx");

    const result = determinePreviewType(file);

    expect(result).toBe("sheet");
  });

  it("sanitizes URLs containing query parameters", () => {
    const url = "https://example.com/download/path/document.pdf?foo=bar";

    const result = determinePreviewType(url);

    expect(result).toBe("pdf");
  });

  it("returns text when file has text mime type", () => {
    const file = new File(["dummy"], "notes.txt", { type: "text/plain" });

    const result = determinePreviewType(file);

    expect(result).toBe("text");
  });

  it("returns text when file has text extension", () => {
    const file = new File(["dummy"], "data.json");

    const result = determinePreviewType(file);

    expect(result).toBe("text");
  });

  it("returns sheet when file has csv extension", () => {
    const file = new File(["dummy"], "data.csv");

    const result = determinePreviewType(file);

    expect(result).toBe("sheet");
  });

  it("returns file-object when no preview type matches", () => {
    const file = new File(["dummy"], "notes.unknown");

    const result = determinePreviewType(file);

    expect(result).toBe("file-object");
  });

  it("returns pdf when URL has pdf extension", () => {
    const url = "https://example.com/document.pdf";

    const result = determinePreviewType(url);

    expect(result).toBe("pdf");
  });

  it("returns sheet when URL has xlsx extension", () => {
    const url = "https://example.com/spreadsheet.xlsx";

    const result = determinePreviewType(url);

    expect(result).toBe("sheet");
  });

  it("returns text when URL has json extension", () => {
    const url = "https://example.com/data.json";

    const result = determinePreviewType(url);

    expect(result).toBe("text");
  });

  it("returns pdf when data URL has pdf mime type", () => {
    const dataUrl =
      "data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDExMyAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE3MQolJUVPRgo=";

    const result = determinePreviewType(dataUrl);

    expect(result).toBe("pdf");
  });

  it("returns text when data URL has text/plain mime type", () => {
    const dataUrl = "data:text/plain;base64,SGVsbG8gV29ybGQ=";

    const result = determinePreviewType(dataUrl);

    expect(result).toBe("text");
  });

  it("returns sheet when data URL has csv mime type", () => {
    const dataUrl = "data:text/csv;base64,MSwyLDMKNCw1LDY=";

    const result = determinePreviewType(dataUrl);

    expect(result).toBe("sheet");
  });

  it("returns file-object when URL has no extension", () => {
    const url = "https://example.com/path/to/file";

    const result = determinePreviewType(url);

    expect(result).toBe("file-object");
  });

  it("returns file-object when URL has unknown extension", () => {
    const url = "https://example.com/document.unknown";

    const result = determinePreviewType(url);

    expect(result).toBe("file-object");
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
