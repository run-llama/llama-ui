import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useEffect, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression test for `<Page>` outliving its document.
 *
 * When the `url` prop changes, `PdfPreviewImpl` clears `file`, which makes
 * react-pdf destroy the current document's worker transport. Any `<Page>` that
 * mounts in that same commit then calls `getPage()` on the dead transport and
 * throws `Cannot read properties of null (reading 'sendWithPromise')`.
 *
 * The mock below reproduces that contract exactly — a `Page` mounting while
 * its `Document` has no file throws — so the invariant is pinned without
 * depending on real pdf.js timing.
 */

let currentDocumentFile: File | null = null;
const pageMounts = vi.fn();
const documentMounts = vi.fn();

vi.mock("react-pdf", () => ({
  pdfjs: { GlobalWorkerOptions: { workerSrc: "" }, version: "0.0.0-test" },
  PasswordResponses: { NEED_PASSWORD: 1, INCORRECT_PASSWORD: 2 },
  Document: ({
    file,
    onLoadSuccess,
    children,
  }: {
    file: File | null;
    onLoadSuccess?: (doc: { numPages: number }) => void;
    children?: ReactNode;
  }) => {
    currentDocumentFile = file;
    useEffect(() => {
      documentMounts();
    }, []);
    useEffect(() => {
      if (file) onLoadSuccess?.({ numPages: 3 });
    }, [file, onLoadSuccess]);
    return createElement("div", { "data-testid": "document" }, children);
  },
  Page: ({
    pageNumber,
    onLoadSuccess,
  }: {
    pageNumber: number;
    onLoadSuccess?: (page: unknown) => void;
  }) => {
    if (!currentDocumentFile) {
      throw new Error(
        `<Page ${pageNumber}> mounted while <Document> had no file — ` +
          "this is the destroyed-transport crash"
      );
    }
    pageMounts(pageNumber);
    useEffect(() => {
      onLoadSuccess?.({
        pageNumber,
        getViewport: () => ({ width: 600, height: 800 }),
      });
    }, [pageNumber, onLoadSuccess]);
    return createElement("div", { "data-testid": `page-${pageNumber}` });
  },
}));

const { PdfPreviewImpl } = await import(
  "../../src/file-preview/pdf-preview-impl"
);

function pdfResponse() {
  return {
    ok: true,
    statusText: "OK",
    blob: async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }),
  } as unknown as Response;
}

describe("PdfPreviewImpl document swap", () => {
  beforeEach(() => {
    currentDocumentFile = null;
    pageMounts.mockClear();
    documentMounts.mockClear();

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => pdfResponse())
    );
    Element.prototype.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never renders pages once the document's file is cleared", async () => {
    const { rerender } = render(<PdfPreviewImpl url="/first.pdf" />);

    await waitFor(() => expect(screen.getByTestId("page-1")).toBeTruthy());
    expect(pageMounts).toHaveBeenCalled();

    // Swapping the url tears the first document down and loads a second one.
    // The old page count must not survive into that window.
    rerender(<PdfPreviewImpl url="/second.pdf" />);

    await waitFor(() => expect(screen.getByTestId("page-1")).toBeTruthy());
    expect(currentDocumentFile).not.toBeNull();
  });

  it("remounts <Document> when the url changes", async () => {
    const { rerender } = render(<PdfPreviewImpl url="/first.pdf" />);
    await waitFor(() => expect(screen.getByTestId("page-1")).toBeTruthy());
    expect(documentMounts).toHaveBeenCalledTimes(1);

    // A superseded document's RESOLVE is not cancelled by react-pdf's cleanup,
    // so reusing the same <Document> lets a destroyed pdf land in context.
    // A fresh instance per url makes that dispatch a no-op instead.
    rerender(<PdfPreviewImpl url="/second.pdf" />);
    await waitFor(() => expect(documentMounts).toHaveBeenCalledTimes(2));
  });

  it("renders no pages while the document is still loading", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve)))
    );

    render(<PdfPreviewImpl url="/slow.pdf" />);

    expect(screen.queryByTestId("page-1")).toBeNull();
    expect(pageMounts).not.toHaveBeenCalled();

    resolveFetch(pdfResponse());
    await waitFor(() => expect(screen.getByTestId("page-1")).toBeTruthy());
  });
});
