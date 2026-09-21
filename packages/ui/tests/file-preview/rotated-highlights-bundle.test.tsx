import { render, waitFor } from "@testing-library/react";
import { createElement, useEffect, type ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
// CI builds before running tests. Exercise shipped preview routing and lazy PDF
// chunks, not source aliases. Only PDF decoding/network are mocked here.
import { DocumentPreview } from "../../dist/document-preview/index.mjs";

vi.mock("react-pdf", () => ({
  pdfjs: { GlobalWorkerOptions: { workerSrc: "" }, version: "test" },
  PasswordResponses: { NEED_PASSWORD: 1, INCORRECT_PASSWORD: 2 },
  Document: ({
    file,
    onLoadSuccess,
    children,
  }: {
    file: File | null;
    onLoadSuccess: (doc: { numPages: number }) => void;
    children: ReactNode;
  }) => {
    useEffect(() => {
      if (file) onLoadSuccess({ numPages: 1 });
    }, [file, onLoadSuccess]);
    return createElement("div", null, children);
  },
  Page: ({
    pageNumber,
    onLoadSuccess,
  }: {
    pageNumber: number;
    onLoadSuccess: (page: unknown) => void;
  }) => {
    useEffect(() => {
      onLoadSuccess({
        pageNumber,
        getViewport: () => ({ width: 600, height: 800 }),
      });
    }, [pageNumber, onLoadSuccess]);
    return null;
  },
}));

const originalScrollTo = Element.prototype.scrollTo;
afterEach(() => {
  vi.unstubAllGlobals();
  Element.prototype.scrollTo = originalScrollTo;
});

it("keeps rotated highlights through the built document preview and PDF chunks", async () => {
  Element.prototype.scrollTo = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }),
    }))
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  const rotations = [30, -30, 90, 0];
  const { container } = render(
    <DocumentPreview
      value="/page.pdf"
      fileName="page.pdf"
      scale={2}
      onScaleChange={() => {}}
      highlights={rotations.map((rotation) => ({
        page: 1,
        x: 20,
        y: 40,
        width: 120,
        height: 10,
        rotation,
      }))}
    />
  );
  await waitFor(() =>
    expect(container.querySelectorAll("svg rect")).toHaveLength(4)
  );
  const boxes = [...container.querySelectorAll("svg rect")];
  expect(
    boxes.map((box) => box.parentElement?.getAttribute("transform"))
  ).toEqual([
    "rotate(30 80 45)",
    "rotate(-30 80 45)",
    "rotate(90 80 45)",
    null,
  ]);
  expect(boxes[0]?.closest("svg")?.style.width).toBe("1200px");
});
