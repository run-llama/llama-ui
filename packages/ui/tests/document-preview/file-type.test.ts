import { describe, expect, it } from "vitest";

import {
  determinePreviewType,
  resolveFileName,
} from "../../src/document-preview/file-type";

describe("determinePreviewType", () => {
  it("returns mapped preview when mime type matches", () => {
    const file = new File(["dummy"], "report.pdf", {
      type: "application/pdf",
    });

    const result = determinePreviewType({ content: file, fileName: null });

    expect(result).toBe("pdf");
  });

  it("falls back to provided file name extension", () => {
    const result = determinePreviewType({
      content: null,
      fileName: "budget.XLS",
    });

    expect(result).toBe("sheet");
  });

  it("uses the File name when mime type is unavailable", () => {
    const file = new File(["dummy"], "ledger.xlsx");

    const result = determinePreviewType({ content: file });

    expect(result).toBe("sheet");
  });

  it("sanitizes file names containing query parameters", () => {
    const result = determinePreviewType({
      content: null,
      fileName: "download/path/document.pdf?foo=bar",
    });

    expect(result).toBe("pdf");
  });

  it("returns text when file has text mime type", () => {
    const file = new File(["dummy"], "notes.txt", { type: "text/plain" });

    const result = determinePreviewType({ content: file });

    expect(result).toBe("text");
  });

  it("returns text when file has text extension", () => {
    const file = new File(["dummy"], "data.json");

    const result = determinePreviewType({ content: file });

    expect(result).toBe("text");
  });

  it("returns sheet when file has csv extension", () => {
    const file = new File(["dummy"], "data.csv");

    const result = determinePreviewType({ content: file });

    expect(result).toBe("sheet");
  });

  it("returns file-object when no preview type matches", () => {
    const file = new File(["dummy"], "notes.unknown");

    const result = determinePreviewType({ content: file });

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
