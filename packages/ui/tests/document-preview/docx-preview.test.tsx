import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { DocxPreview } from "../../src/document-preview/previews/docx-preview";

const ORIGINAL_FETCH = globalThis.fetch;

const convertToHtmlMock = vi.fn();

vi.mock("mammoth", () => ({
  convertToHtml: (...args: unknown[]) => convertToHtmlMock(...args),
  default: {
    convertToHtml: (...args: unknown[]) => convertToHtmlMock(...args),
  },
}));

describe("DocxPreview", () => {
  beforeEach(() => {
    convertToHtmlMock.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("passes the fetched arrayBuffer to mammoth and renders the result", async () => {
    const arrayBuffer = new ArrayBuffer(4);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => arrayBuffer,
    }) as unknown as typeof fetch;
    convertToHtmlMock.mockResolvedValue({ value: "<h1>Doc title</h1>" });

    render(<DocxPreview contentUrl="https://example.com/sample.docx" />);

    await waitFor(() => {
      expect(convertToHtmlMock).toHaveBeenCalledWith({ arrayBuffer });
    });

    const iframe = await waitFor(() => {
      const el = document.querySelector("iframe");
      expect(el).not.toBeNull();
      return el as HTMLIFrameElement;
    });

    expect(iframe.getAttribute("sandbox")).toBe("allow-same-origin");
    expect(iframe.getAttribute("srcdoc")).toContain("<h1>Doc title</h1>");
  });

  it("surfaces mammoth errors as the error state", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(0),
    }) as unknown as typeof fetch;
    convertToHtmlMock.mockRejectedValue(new Error("mammoth blew up"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<DocxPreview contentUrl="https://example.com/corrupt.docx" />);

    expect(
      await screen.findByText(/failed to render document/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/mammoth blew up/i)).toBeInTheDocument();
  });
});
