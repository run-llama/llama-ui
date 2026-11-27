import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement, useEffect, type ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Highlight } from "../../src/file-preview/types";

// What the fake document and the fake layout below read. Reset per test.
const layout = { numPages: 3, scrollTop: 0 };

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
      if (file) onLoadSuccess?.({ numPages: layout.numPages });
    }, [file, onLoadSuccess]);
    return createElement("div", null, children);
  },
  Page: ({
    pageNumber,
    renderTextLayer,
    onLoadSuccess,
  }: {
    pageNumber: number;
    renderTextLayer?: boolean;
    onLoadSuccess?: (page: unknown) => void;
  }) => {
    useEffect(() => {
      onLoadSuccess?.({
        pageNumber,
        getViewport: () => ({ width: 600, height: 800 }),
      });
    }, [pageNumber, onLoadSuccess]);
    return createElement("div", {
      "data-testid": `page-${pageNumber}`,
      "data-text-layer": String(renderTextLayer),
    });
  },
}));

const { PdfPreviewImpl } = await import(
  "../../src/file-preview/pdf-preview-impl"
);

// jsdom has no layout. Lay out 600x800 pages, 16px apart, centered in a
// 800x600 scroll container scrolled to `layout.scrollTop`. `scrollTo` is a
// spy, so the container never actually moves.
const VIEWPORT = { width: 800, height: 600 };
const PAGE_STRIDE = 816;
const scrollTo = vi.fn();
const originals = {
  scrollTo: Element.prototype.scrollTo,
  getBoundingClientRect: Element.prototype.getBoundingClientRect,
};

beforeEach(() => {
  layout.numPages = 3;
  layout.scrollTop = 0;
  scrollTo.mockClear();
  Element.prototype.scrollTo = scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.getBoundingClientRect = function () {
    const page = Number(this.getAttribute("data-page-number"));
    const top = page ? (page - 1) * PAGE_STRIDE - layout.scrollTop : 0;
    const height = page ? 800 : VIEWPORT.height;
    return new DOMRect(0, top, VIEWPORT.width, height);
  };
  for (const [name, value] of Object.entries({
    clientWidth: () => VIEWPORT.width,
    clientHeight: () => VIEWPORT.height,
    scrollWidth: () => VIEWPORT.width,
    scrollHeight: () => layout.numPages * PAGE_STRIDE,
    scrollTop: () => layout.scrollTop,
  })) {
    vi.spyOn(
      Element.prototype,
      name as "clientWidth",
      "get"
    ).mockImplementation(value);
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

  // Page 3 starts at 1632 and the box is near its top, so the page is brought
  // to 16px below the viewport top: 1632 - 16.
  rerender(preview(3, 100));
  await waitFor(() =>
    expect(scrollTo).toHaveBeenCalledWith({
      top: 1616,
      left: 0,
      behavior: "instant",
    })
  );
});

const preview = (
  highlights: Highlight[] | undefined,
  props: { url?: string; scale?: number; spotlight?: boolean } = {}
) => (
  <PdfPreviewImpl
    url={props.url ?? "/doc.pdf"}
    scale={props.scale ?? 1}
    onScaleChange={() => {}}
    highlights={highlights}
    highlightStyle={props.spotlight ? "spotlight" : "outline"}
  />
);
const boxOn = (page: number, y: number): Highlight[] => [
  { page, x: 100, y, width: 200, height: 50 },
];
const mounted = (page: number) => screen.queryByTestId(`page-${page}`);

// Catches: an in-view highlight on a page other than the toolbar's current
// one leaving that page without its selectable text layer, which only the
// current page and its neighbours get.
it("makes an in-view highlight's page the current page without scrolling", async () => {
  // Viewport 1400..2000 shows the end of page 2 and the start of page 3.
  layout.scrollTop = 1400;
  const { rerender } = render(preview(undefined));
  await waitFor(() => expect(mounted(3)).toBeTruthy());
  expect(mounted(3)?.getAttribute("data-text-layer")).toBe("false");

  rerender(preview(boxOn(3, 100)));

  expect(mounted(3)?.getAttribute("data-text-layer")).toBe("true");
  expect(scrollTo).not.toHaveBeenCalled();
});

// Catches: a highlight on a page at the edge of the mounted window leaving
// the pages after it as placeholders, and far pages never being unmounted
// while the highlight moves through a long document.
it("re-centers the mounted pages on each highlight and keeps on-screen ones", async () => {
  layout.numPages = 20;
  const { rerender } = render(preview(boxOn(1, 100)));
  // The initial window is pages 1 to 11.
  await waitFor(() => expect(mounted(11)).toBeTruthy());
  expect(mounted(12)).toBeNull();

  rerender(preview(boxOn(11, 100)));

  expect(mounted(16)).toBeTruthy();
  expect(mounted(3)).toBeNull();
  // Page 1 is still what the (unmoved) viewport shows, so it stays mounted.
  expect(mounted(1)).toBeTruthy();
});

const smoothScrollToPage2 = async () => {
  const view = render(preview(boxOn(1, 100)));
  await waitFor(() => expect(mounted(3)).toBeTruthy());
  // Page 2 starts at 816 and is one page away, so the scroll is smooth and
  // lands 16px above it.
  view.rerender(preview(boxOn(2, 100)));
  expect(scrollTo).toHaveBeenLastCalledWith({
    top: 800,
    left: 0,
    behavior: "smooth",
  });
  return view;
};

// Catches: a highlight that will be off screen once a running smooth scroll
// lands being judged against the position the container is passing through.
it("judges the next highlight against where a smooth scroll will land", async () => {
  const { rerender } = await smoothScrollToPage2();

  rerender(preview(boxOn(1, 400)));

  expect(scrollTo).toHaveBeenCalledTimes(2);
});

// Catches: the landing position outliving the scroll it described. Each of
// these stops the container heading there; the highlight on page 1 is in view
// where the container really is, so a second scroll means a stale landing.
it.each(["wheel", "touchStart", "keyDown"] as const)(
  "forgets the landing position when the user scrolls by %s",
  async (userInput) => {
    const { rerender } = await smoothScrollToPage2();

    fireEvent[userInput](screen.getByTestId("page-1"), { key: "PageDown" });
    rerender(preview(boxOn(1, 400)));

    expect(scrollTo).toHaveBeenCalledTimes(1);
  }
);

it("forgets the landing position when the zoom changes", async () => {
  const { rerender } = await smoothScrollToPage2();

  rerender(preview(boxOn(1, 100), { scale: 1.5 }));

  expect(scrollTo).toHaveBeenCalledTimes(1);
});

it("forgets the landing position when the document changes", async () => {
  const { rerender } = await smoothScrollToPage2();

  rerender(preview(boxOn(1, 100), { url: "/other.pdf" }));
  expect(mounted(1)).toBeNull();
  await waitFor(() => expect(mounted(3)).toBeTruthy());
  await act(async () => {});

  expect(scrollTo).toHaveBeenCalledTimes(1);
});

const veils = () => document.querySelectorAll("[data-spotlight-veil]");

// Catches: blur layers left on every mounted page while nothing is
// spotlighted, and a highlight on a page outside the document veiling every
// page with nothing left sharp.
it("veils the pages only while a highlight in the page range is spotlighted", async () => {
  const { rerender } = render(preview(undefined, { spotlight: true }));
  await waitFor(() => expect(mounted(3)).toBeTruthy());
  expect(veils()).toHaveLength(0);

  rerender(preview(boxOn(2, 100), { spotlight: true }));
  expect(veils()).toHaveLength(3);

  rerender(preview(boxOn(9, 100), { spotlight: true }));
  expect(veils()).toHaveLength(0);
});
