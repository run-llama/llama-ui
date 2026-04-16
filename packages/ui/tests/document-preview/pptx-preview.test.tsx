import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PptxPreview } from "../../src/document-preview/previews/pptx-preview";

const ORIGINAL_FETCH = globalThis.fetch;

const pptxMock = vi.hoisted(() => {
  const init = vi.fn();
  const loadPptx = vi.fn();
  const isSlideHidden = vi.fn();
  const renderSlideSvg = vi.fn();
  const PptxRenderer = vi.fn(() => ({
    init,
    loadPptx,
    isSlideHidden,
    renderSlideSvg,
  }));
  return { init, loadPptx, isSlideHidden, renderSlideSvg, PptxRenderer };
});

vi.mock("pptx-svg", () => ({
  PptxRenderer: pptxMock.PptxRenderer,
}));

function mockFetchOk() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  }) as unknown as typeof fetch;
}

describe("PptxPreview", () => {
  beforeEach(() => {
    pptxMock.init.mockReset().mockResolvedValue(undefined);
    pptxMock.loadPptx.mockReset();
    pptxMock.isSlideHidden.mockReset().mockReturnValue(false);
    pptxMock.renderSlideSvg.mockReset();
    pptxMock.PptxRenderer.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("renders the first slide's SVG after loading", async () => {
    mockFetchOk();
    pptxMock.loadPptx.mockResolvedValue({ slideCount: 2 });
    pptxMock.renderSlideSvg.mockImplementation(
      (i: number) => `<svg data-slide="${i}"><text>Slide ${i + 1}</text></svg>`
    );

    render(<PptxPreview contentUrl="https://example.com/deck.pptx" />);

    await waitFor(() => {
      expect(document.querySelector("svg[data-slide='0']")).not.toBeNull();
    });

    expect(screen.getByText(/slide 1/i)).toBeInTheDocument();
  });

  it("skips hidden slides when numbering", async () => {
    mockFetchOk();
    pptxMock.loadPptx.mockResolvedValue({ slideCount: 3 });
    pptxMock.isSlideHidden.mockImplementation((i: number) => i === 0);
    pptxMock.renderSlideSvg.mockImplementation(
      (i: number) => `<svg data-slide="${i}"></svg>`
    );

    render(<PptxPreview contentUrl="https://example.com/deck.pptx" />);

    await waitFor(() => {
      // slide at index 0 is hidden; index 1 should be the first shown slide
      expect(document.querySelector("svg[data-slide='1']")).not.toBeNull();
    });
    expect(document.querySelector("svg[data-slide='0']")).toBeNull();
  });

  it("shows a placeholder when a slide fails to render", async () => {
    mockFetchOk();
    pptxMock.loadPptx.mockResolvedValue({ slideCount: 1 });
    pptxMock.renderSlideSvg.mockReturnValue("ERROR: malformed shape");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<PptxPreview contentUrl="https://example.com/deck.pptx" />);

    expect(
      await screen.findByText(/could not be rendered/i)
    ).toBeInTheDocument();
  });

  it("surfaces a top-level error when there are no renderable slides", async () => {
    mockFetchOk();
    pptxMock.loadPptx.mockResolvedValue({ slideCount: 0 });
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<PptxPreview contentUrl="https://example.com/empty.pptx" />);

    expect(
      await screen.findByText(/failed to render presentation/i)
    ).toBeInTheDocument();
  });
});
