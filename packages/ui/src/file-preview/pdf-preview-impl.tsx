import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// @ts-expect-error react-pdf types have no declarations
import type { PageCallback } from "react-pdf/dist/shared/types";
import { FileToolbar } from "../document-preview/file-tool-bar";
import { BoundingBoxOverlay } from "./bounding-box-overlay";
import type { BoundingBox, Highlight } from "./types";

// Configure worker path for PDF.js
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// Side-effect CSS imports – ignore TypeScript complaints. Also inconsistent checking between projects. Whatever
// eslint-disable-next-line
// @ts-ignore react-pdf CSS import has no types
import("react-pdf/dist/Page/AnnotationLayer.css");
// eslint-disable-next-line
// @ts-ignore react-pdf CSS import has no types
import("react-pdf/dist/Page/TextLayer.css");

export interface PdfPreviewImplProps {
  fileName?: string | null;
  url: string;
  onDownload?: () => void;
  onRemove?: () => void;
  highlights?: Highlight[];
  toolbarClassName?: string;
  maxPages?: number;
  maxPagesWarning?: string;
  onMaxPagesChange?: (newMaxPages: number) => void;
}

// map of page number to page viewport dimensions
type PageBaseDims = {
  [key: number]: { width: number; height: number };
};

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
};

// show rendering progress bar for files larger than this
const FILE_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_PAGES_INCREMENT = 25;

export const PdfPreviewImpl = ({
  fileName,
  url,
  onDownload,
  onRemove,
  highlights,
  toolbarClassName,
  maxPages,
  maxPagesWarning,
  onMaxPagesChange,
}: PdfPreviewImplProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [renderedPages, setRenderedPages] = useState<number>(0);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const isInitialScaleSet = useRef(false);

  const [pageBaseDims, setPageBaseDims] = useState<PageBaseDims>({}); // store page viewport to use for bounding box overlay
  const [showHighlights, setShowHighlights] = useState<boolean>(true); // whether to show the highlights
  const [displayMaxPages, setDisplayMaxPages] = useState<number | undefined>(maxPages); // current page limit (can be extended)

  const hasPageLimit =
    typeof displayMaxPages === "number" && Number.isFinite(displayMaxPages) && displayMaxPages > 0;

  const effectiveNumPages = useMemo(() => {
    if (!numPages) return numPages;
    if (!hasPageLimit) return numPages;
    return Math.min(numPages, displayMaxPages ?? numPages);
  }, [numPages, hasPageLimit, displayMaxPages]);

  const showMaxPagesWarning =
    hasPageLimit &&
    !!numPages &&
    numPages > (displayMaxPages ?? 0);

  // Generate dynamic message based on the page limit
  const warningMessage =
    !showMaxPagesWarning || !displayMaxPages
      ? maxPagesWarning ?? ""
      : maxPagesWarning ??
      `The document has ${numPages} pages. Limiting the preview to ${displayMaxPages} pages to increase performance.`;

  const handleExtendMaxPages = () => {
    if (!numPages || !displayMaxPages) return;

    // Use maxPages prop as increment amount, or default to DEFAULT_MAX_PAGES_INCREMENT if not provided
    const incrementAmount = maxPages ?? DEFAULT_MAX_PAGES_INCREMENT;
    const newMaxPages = Math.min(displayMaxPages + incrementAmount, numPages);
    setDisplayMaxPages(newMaxPages);
    onMaxPagesChange?.(newMaxPages);
  };

  // Convert highlights to bounding boxes grouped by page
  const highlightsByPage = useMemo(() => {
    if (!highlights || highlights.length === 0) {
      return {} as { [page: number]: BoundingBox[] };
    }

    const grouped: { [page: number]: BoundingBox[] } = {};
    highlights.forEach((highlight, idx) => {
      if (!grouped[highlight.page]) {
        grouped[highlight.page] = [];
      }
      grouped[highlight.page].push({
        id: `highlight-${highlight.page}-${idx}`,
        x: highlight.x,
        y: highlight.y,
        width: highlight.width,
        height: highlight.height,
        color: "rgba(255, 215, 0, 0.25)",
      });
    });
    return grouped;
  }, [highlights]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setRenderedPages(0);
    setIsRendering(true);
  }

  function handlePageRenderSuccess() {
    setRenderedPages((prev) => {
      const next = prev + 1;
      if (effectiveNumPages && next === effectiveNumPages) {
        setIsRendering(false); // all pages finished
      }
      return next;
    });
  }

  // Navigate to specific page
  const goToPage = useCallback(
    (pageNumber: number) => {
      const maxPage = effectiveNumPages ?? 1;
      const targetPage = Math.min(Math.max(pageNumber, 1), maxPage);
      setCurrentPage(targetPage);
      const pageElement = pageRefs.current[targetPage];
      if (pageElement && containerRef.current) {
        pageElement.scrollIntoView({
          behavior: "instant",
          block: "center",
        });
      }
    },
    [effectiveNumPages]
  );

  // when highlights are set, navigate to the first highlight's page
  useEffect(() => {
    if (!highlights || highlights.length === 0) return;
    if (!effectiveNumPages) return;

    const firstHighlight = highlights[0];
    if (firstHighlight.page > effectiveNumPages) return;
    const pageEl = pageRefs.current[firstHighlight.page];
    if (pageEl) {
      goToPage(firstHighlight.page);
      setShowHighlights(true);
    }
  }, [highlights, effectiveNumPages, goToPage]);

  useEffect(() => {
    // Clamp any pre-existing currentPage so it never points past the capped render range.
    if (!effectiveNumPages) return;
    setCurrentPage((prev) => Math.min(prev, effectiveNumPages));
  }, [effectiveNumPages]);

  // store page viewport to use for bounding box overlay
  const handleLoadPage = (page: PageCallback) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageBaseDims((prev) => ({
      ...prev,
      [page.pageNumber]: {
        width: viewport.width,
        height: viewport.height,
      },
    }));

    // Auto-scale PDF to fit the container width at the initial load
    if (
      !isInitialScaleSet.current &&
      page.pageNumber === 1 &&
      containerRef.current
    ) {
      const containerWidth = containerRef.current.clientWidth;
      const padding = 16;
      const availableWidth = containerWidth - padding;
      const newScale = availableWidth / viewport.width;
      setScale(newScale);
      isInitialScaleSet.current = true;
    }
  };

  // click anywhere on the page to hide the highlights
  const handleClickOnPage = () => {
    if (showHighlights) {
      setShowHighlights(false);
    }
  };

  // Detect current visible page on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let closestPage = 1;
      let closestDistance = Infinity;

      Object.entries(pageRefs.current).forEach(([pageNumber, element]) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const pageCenter = rect.top + rect.height / 2;
          const distance = Math.abs(pageCenter - containerCenter);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPage = parseInt(pageNumber);
          }
        }
      });

      const totalPages = effectiveNumPages ?? closestPage;
      const clampedPage = Math.min(Math.max(closestPage, 1), totalPages);
      setCurrentPage(clampedPage);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [effectiveNumPages]);

  const lastLoadedUrl = useRef<string | null>(null);
  useEffect(() => {
    // prevent double effect runs that react likes to do in dev mode. Double load
    // Causes the pdf library to crash with file identity changing, and causes a lot of flickering.
    if (lastLoadedUrl.current === url) {
      return;
    }
    lastLoadedUrl.current = url;
    const fetchFile = async () => {
      setIsLoading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      setFile(
        new File([blob], fileName ?? "document.pdf", {
          type: "application/pdf",
        })
      );
      setIsLoading(false);
    };
    fetchFile();
    return () => {
      setFile(null);
    };
  }, [url, fileName]);

  // Handle keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentPage > 1) {
          goToPage(currentPage - 1);
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        const totalPages = effectiveNumPages ?? currentPage;
        if (currentPage < totalPages) {
          goToPage(currentPage + 1);
        }
      } else if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        setScale((prev) => Math.min(prev + 0.25, 3.0));
      } else if (event.key === "-") {
        event.preventDefault();
        setScale((prev) => Math.max(prev - 0.25, 0.5));
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    // Make sure the container can actually receive keyboard focus
    container.tabIndex = 0;

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, effectiveNumPages, goToPage]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      if (file) {
        // Use the already loaded file for download
        const blobUrl = URL.createObjectURL(file);

        // Create download link
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name; // Use the file's original name

        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the object URL
        URL.revokeObjectURL(blobUrl);
      } else {
        // Fallback: open in new tab if file is not loaded yet
        window.open(url, "_blank");
      }
    }
  };

  const handleReset = () => {
    setCurrentPage(1);
    goToPage(1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="relative h-full flex flex-col">
        <FileToolbar
          fileName={fileName}
          onRemove={onRemove}
          className={toolbarClassName}
        />
        <div className="h-3 bg-[#F3F3F3]"></div>
        <div className="relative flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Only show rendering progress bar for large files */}
      {isRendering && file && file.size > FILE_SIZE_THRESHOLD && (
        <PdfRenderingProgress
          renderedPages={renderedPages}
          numPages={effectiveNumPages}
        />
      )}

      {/* Navigation Component */}
      {effectiveNumPages && effectiveNumPages > 0 && (
        <>
          <FileToolbar
            fileName={fileName}
            currentPage={currentPage}
            totalPages={effectiveNumPages}
            scale={scale}
            onPageChange={goToPage}
            onScaleChange={setScale}
            onDownload={handleDownload}
            onRemove={onRemove}
            onReset={handleReset}
            onFullscreen={toggleFullscreen}
            className={toolbarClassName}
            isOverlay
          />
          <div className="h-10 flex-shrink-0" />
          {showMaxPagesWarning && (
            <div
              role="alert"
              className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm flex items-center justify-between gap-2 flex-shrink-0"
            >
              <span>{warningMessage}</span>
              {numPages && displayMaxPages && numPages > displayMaxPages && (
                <button
                  onClick={handleExtendMaxPages}
                  className="text-amber-700 hover:text-amber-900 underline font-medium text-sm whitespace-nowrap"
                >
                  Show more pages
                </button>
              )}
            </div>
          )}
        </>
      )}

      <div
        ref={containerRef}
        className="overflow-auto h-full bg-[#F3F3F3] rounded-lg flex-1 min-h-0"
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={isLoading}
          options={pdfOptions}
        >
          {Array.from({ length: effectiveNumPages ?? 0 }, (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => {
                pageRefs.current[index + 1] = el;
              }}
              className="mb-4 flex justify-center min-w-max"
            >
              <div className="relative inline-block">
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onLoadSuccess={handleLoadPage}
                  onClick={handleClickOnPage}
                  onRenderSuccess={handlePageRenderSuccess}
                />
                {showHighlights &&
                  highlightsByPage[index + 1] &&
                  pageBaseDims[index + 1] && (
                    <BoundingBoxOverlay
                      boundingBoxes={highlightsByPage[index + 1]}
                      zoom={scale}
                      containerWidth={pageBaseDims[index + 1].width}
                      containerHeight={pageBaseDims[index + 1].height}
                    />
                  )}
              </div>
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
};

function PdfRenderingProgress({
  renderedPages,
  numPages,
}: {
  renderedPages: number;
  numPages: number | undefined;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-50">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-80 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Rendering PDF…
        </h2>

        <p className="text-sm text-gray-600 mb-3">
          Page {renderedPages} of {numPages ?? "?"}
        </p>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{
              width:
                numPages && numPages > 0
                  ? `${Math.round((renderedPages / numPages) * 100)}%`
                  : "0%",
            }}
          />
        </div>

        <p className="text-xs text-gray-500">
          Large PDFs or those with heavy images may take longer to render.
        </p>
      </div>
    </div>
  );
}
