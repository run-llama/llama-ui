import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useEffect, type ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

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
    useEffect(() => {
      if (file) onLoadSuccess?.({ numPages: 3 });
    }, [file, onLoadSuccess]);
    return createElement("div", null, children);
  },
  Page: ({
    pageNumber,
    onLoadSuccess,
  }: {
    pageNumber: number;
    onLoadSuccess?: (page: unknown) => void;
  }) => {
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

// jsdom has no layout. Lay out three 600x800 pages, 16px apart, centered in a
// 800x600 scroll container that is scrolled to the top.
const VIEWPORT = { width: 800, height: 600 };
const PAGE_STRIDE = 816;
const scrollTo = vi.fn();
const originals = {
  scrollTo: Element.prototype.scrollTo,
  getBoundingClientRect: Element.prototype.getBoundingClientRect,
};

beforeEach(() => {
  scrollTo.mockClear();
  Element.prototype.scrollTo = scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.getBoundingClientRect = function () {
    const page = Number(this.getAttribute("data-page-number"));
    const top = page ? (page - 1) * PAGE_STRIDE : 0;
    const height = page ? 800 : VIEWPORT.height;
    return new DOMRect(0, top, VIEWPORT.width, height);
  };
  for (const [name, value] of Object.entries({
    clientWidth: VIEWPORT.width,
    clientHeight: VIEWPORT.height,
    scrollWidth: VIEWPORT.width,
    scrollHeight: 3 * PAGE_STRIDE,
  })) {
    vi.spyOn(
      HTMLElement.prototype,
      name as "clientWidth",
      "get"
    ).mockReturnValue(value);
  }
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
    vi.fn(async () => ({
      ok: true,
      statusText: "OK",
      blob: async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }),
    }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Object.assign(Element.prototype, originals);
});

// Catches: the preview re-scrolling on every highlight change, which makes the
// document jump while a user hovers fields whose sources are already visible.
// The off-screen highlight at the end proves the scroll path is still wired.
it("scrolls only for a highlight that is off screen", async () => {
  const preview = (page: number, y: number) => (
    <PdfPreviewImpl
      url="/doc.pdf"
      scale={1}
      onScaleChange={() => {}}
      highlights={[{ page, x: 100, y, width: 200, height: 50 }]}
    />
  );
  const { rerender } = render(preview(1, 100));
  await waitFor(() => expect(screen.getByTestId("page-3")).toBeTruthy());

  rerender(preview(1, 400));
  expect(scrollTo).not.toHaveBeenCalled();

  // Page 3 starts at 1632: 1632 + 100 - (600 - 50) / 2.
  rerender(preview(3, 100));
  await waitFor(() =>
    expect(scrollTo).toHaveBeenCalledWith({
      top: 1457,
      left: 0,
      behavior: "instant",
    })
  );
});
