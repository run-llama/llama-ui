import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { HtmlPreview } from "../../src/document-preview/previews/html-preview";

const ORIGINAL_FETCH = globalThis.fetch;

describe("HtmlPreview", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("renders fetched HTML inside a sandboxed iframe", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("<h1>Hello</h1>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    ) as unknown as typeof fetch;

    render(<HtmlPreview contentUrl="https://example.com/file.html" />);

    const iframe = await waitFor(() => {
      const el = document.querySelector("iframe");
      expect(el).not.toBeNull();
      return el as HTMLIFrameElement;
    });

    expect(iframe.getAttribute("sandbox")).toBe("allow-same-origin");
    expect(iframe.getAttribute("srcdoc")).toContain("<h1>Hello</h1>");
  });

  it("shows an error state and a download link when fetch fails", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("nope", { status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<HtmlPreview contentUrl="https://example.com/broken.html" />);

    expect(
      await screen.findByText(/failed to load html/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download File" })
    ).toBeTruthy();
  });

  it("shows loading state before fetch resolves", () => {
    let resolve: (value: Response) => void = () => {};
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    ) as unknown as typeof fetch;

    render(<HtmlPreview contentUrl="https://example.com/file.html" />);
    expect(screen.getByText(/loading html/i)).toBeInTheDocument();

    // Prevent unhandled promise leak at teardown.
    resolve(new Response("<p/>", { status: 200 }));
  });
});
