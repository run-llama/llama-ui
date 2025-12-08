import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// @ts-expect-error react-pdf types have no declarations
import type { PageCallback } from "react-pdf/dist/shared/types";
import { logger } from "@shared/logger";
import { Button } from "@/base/button";
import { FileToolbar } from "../document-preview/file-tool-bar";
import { BoundingBoxOverlay } from "./bounding-box-overlay";
import type { Highlight } from "./types";
import {
  calculateEffectiveNumPages,
  calculateExtendedMaxPages,
  calculateFitToWidthScale,
  calculateVisiblePageRange,
  findClosestPage,
  generatePageLimitWarning,
  groupHighlightsByPage,
} from "./pdf-preview-utils";

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
const VIRTUALIZATION_BUFFER = 2;

export const PdfPreviewImpl = ({
  fileName,
  url,
  onDownload,
  onRemove,
  highlights,
  toolbarClassName,
  maxPages,
  maxPagesWarning,
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
  const [displayMaxPages, setDisplayMaxPages] = useState<number | undefined>(
    maxPages
  ); // current page limit (can be extended)
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const [pageHeights, setPageHeights] = useState<{ [key: number]: number }>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const hasPageLimit =
    typeof displayMaxPages === "number" &&
    Number.isFinite(displayMaxPages) &&
    displayMaxPages > 0;

  const effectiveNumPages = useMemo(
    () => calculateEffectiveNumPages(numPages, displayMaxPages),
    [numPages, displayMaxPages]
  );

  const showMaxPagesWarning =
    hasPageLimit && !!numPages && numPages > (displayMaxPages ?? 0);

  const warningMessage = useMemo(
    () =>
      generatePageLimitWarning(numPages, displayMaxPages, maxPagesWarning),
    [numPages, displayMaxPages, maxPagesWarning]
  );

  const handleExtendMaxPages = () => {
    if (!numPages || !displayMaxPages) return;

    const incrementAmount = maxPages ?? DEFAULT_MAX_PAGES_INCREMENT;
    const newMaxPages = calculateExtendedMaxPages(
      displayMaxPages,
      numPages,
      incrementAmount
    );
    setDisplayMaxPages(newMaxPages);
  };

  const highlightsByPage = useMemo(
    () => groupHighlightsByPage(highlights),
    [highlights]
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setRenderedPages(0);
      setIsRendering(true);
      setLoadError(null);
      const initialPages = calculateVisiblePageRange(
        1,
        numPages,
        VIRTUALIZATION_BUFFER
      );
      setVisiblePages(new Set(initialPages));
    },
    []
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    logger.error("Error loading PDF", error);
    setLoadError(
      error.message || "Failed to load PDF. The file may be corrupted or too large."
    );
    setIsLoading(false);
  }, []);

  const handlePageRenderSuccess = useCallback(() => {
    setRenderedPages((prev) => {
      const next = prev + 1;
      if (effectiveNumPages && next === effectiveNumPages) {
        setIsRendering(false);
      }
      return next;
    });
  }, [effectiveNumPages]);

  // Navigate to specific page
  const goToPage = useCallback(
    (pageNumber: number) => {
      const maxPage = effectiveNumPages ?? 1;
      const targetPage = Math.min(Math.max(pageNumber, 1), maxPage);
      setCurrentPage(targetPage);

      const visibleRange = calculateVisiblePageRange(
        targetPage,
        maxPage,
        VIRTUALIZATION_BUFFER
      );
      setVisiblePages(new Set(visibleRange));

      setTimeout(() => {
        const pageElement = pageRefs.current[targetPage];
        if (pageElement && containerRef.current) {
          pageElement.scrollIntoView({
            behavior: "instant",
            block: "center",
          });
        }
      }, 0);
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
    if (!effectiveNumPages) return;
    setCurrentPage((prev) => Math.min(prev, effectiveNumPages));
    setVisiblePages((prev) => {
      const current = Math.min(
        prev.size > 0 ? Math.max(...prev) : 1,
        effectiveNumPages
      );
      const visibleRange = calculateVisiblePageRange(
        current,
        effectiveNumPages,
        VIRTUALIZATION_BUFFER
      );
      return new Set(visibleRange);
    });
  }, [effectiveNumPages]);

  useEffect(() => {
    setPageHeights({});
    setVisiblePages((prev) => new Set(prev));
  }, [scale]);

  // store page viewport to use for bounding box overlay
  const handleLoadPage = useCallback(
    (page: PageCallback) => {
      const viewport = page.getViewport({ scale: 1 });
      setPageBaseDims((prev) => ({
        ...prev,
        [page.pageNumber]: {
          width: viewport.width,
          height: viewport.height,
        },
      }));

      const scaledHeight = viewport.height * scale;
      setPageHeights((prev) => ({
        ...prev,
        [page.pageNumber]: scaledHeight,
      }));

      if (
        !isInitialScaleSet.current &&
        page.pageNumber === 1 &&
        containerRef.current
      ) {
        const containerWidth = containerRef.current.clientWidth;
        const newScale = calculateFitToWidthScale(
          viewport.width,
          containerWidth
        );
        setScale(newScale);
        isInitialScaleSet.current = true;
      }
    },
    [scale]
  );

  // click anywhere on the page to hide the highlights
  const handleClickOnPage = () => {
    if (showHighlights) {
      setShowHighlights(false);
    }
  };

  useEffect(() => {
    if (!effectiveNumPages || !containerRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prevVisiblePages) => {
          const newVisiblePages = new Set<number>(prevVisiblePages);

          entries.forEach((entry) => {
            const pageNumber = parseInt(
              entry.target.getAttribute("data-page-number") || "0"
            );
            if (pageNumber > 0) {
              if (entry.isIntersecting) {
                for (
                  let i = Math.max(1, pageNumber - VIRTUALIZATION_BUFFER);
                  i <= Math.min(effectiveNumPages, pageNumber + VIRTUALIZATION_BUFFER);
                  i++
                ) {
                  newVisiblePages.add(i);
                }
              } else {
                const isNearVisible = Array.from(prevVisiblePages).some((p) =>
                  Math.abs(p - pageNumber) <= VIRTUALIZATION_BUFFER
                );
                if (!isNearVisible) {
                  newVisiblePages.delete(pageNumber);
                }
              }
            }
          });

          return newVisiblePages;
        });
      },
      {
        root: containerRef.current,
        rootMargin: "200px",
        threshold: 0.01,
      }
    );

    const timeoutId = setTimeout(() => {
      Object.entries(pageRefs.current).forEach(([pageNumber, element]) => {
        if (element && observerRef.current) {
          observerRef.current.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [effectiveNumPages]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const closestPage = findClosestPage(pageRefs.current, containerRect);

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
    // Reset displayMaxPages to the maxPages prop when loading a new PDF
    setDisplayMaxPages(maxPages);
    setLoadError(null);
    setVisiblePages(new Set([1]));
    setPageHeights({});
    const fetchFile = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
        const blob = await response.blob();
        setFile(
          new File([blob], fileName ?? "document.pdf", {
            type: "application/pdf",
          })
        );
      } catch (error) {
        logger.error("Error fetching PDF", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load PDF. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchFile();
    return () => {
      setFile(null);
    };
  }, [url, fileName, maxPages]);

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

  if (loadError) {
    return (
      <div className="relative h-full flex flex-col">
        <FileToolbar
          fileName={fileName}
          onRemove={onRemove}
          className={toolbarClassName}
        />
        <div className="h-3 bg-[#F3F3F3]"></div>
        <div className="relative flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-4">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load PDF
            </h3>
            <p className="text-sm text-gray-600 mb-4">{loadError}</p>
            <Button
              onClick={() => {
                setLoadError(null);
                lastLoadedUrl.current = null;
                setFile(null);
              }}
            >
              Retry
            </Button>
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
          />
          {showMaxPagesWarning && (
            <div
              role="alert"
              className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs flex items-center justify-between gap-2 flex-shrink-0"
            >
              <span>{warningMessage}</span>
              {numPages && displayMaxPages && numPages > displayMaxPages && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExtendMaxPages}
                  className="text-amber-700 hover:text-amber-900 underline font-medium text-xs whitespace-nowrap h-auto p-0"
                >
                  Show more pages
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <div
        ref={containerRef}
        className="overflow-auto h-full bg-[#F3F3F3] flex-1 min-h-0"
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={isLoading}
          options={pdfOptions}
        >
          {Array.from({ length: effectiveNumPages ?? 0 }, (_, index) => {
            const pageNumber = index + 1;
            const isVisible = visiblePages.has(pageNumber);
            const pageHeight = pageHeights[pageNumber];

            return (
              <div
                key={`page_${pageNumber}`}
                ref={(el) => {
                  pageRefs.current[pageNumber] = el;
                  if (el && observerRef.current) {
                    requestAnimationFrame(() => {
                      if (el && observerRef.current) {
                        observerRef.current.observe(el);
                      }
                    });
                  }
                }}
                data-page-number={pageNumber}
                className="mb-4 flex justify-center min-w-max"
                style={
                  !isVisible && pageHeight
                    ? {
                        height: `${pageHeight}px`,
                        minHeight: `${pageHeight}px`,
                      }
                    : undefined
                }
              >
                {isVisible ? (
                  <div className="relative inline-block">
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onLoadSuccess={handleLoadPage}
                      onClick={handleClickOnPage}
                      onRenderSuccess={handlePageRenderSuccess}
                    />
                    {showHighlights &&
                      highlightsByPage[pageNumber] &&
                      pageBaseDims[pageNumber] && (
                        <BoundingBoxOverlay
                          boundingBoxes={highlightsByPage[pageNumber]}
                          zoom={scale}
                          containerWidth={pageBaseDims[pageNumber].width}
                          containerHeight={pageBaseDims[pageNumber].height}
                        />
                      )}
                  </div>
                ) : (
                  <div
                    className="relative inline-block bg-gray-100 flex items-center justify-center"
                    style={
                      pageHeight
                        ? {
                            width: "100%",
                            height: `${pageHeight}px`,
                            minHeight: `${pageHeight}px`,
                          }
                        : { minHeight: "800px" }
                    }
                  >
                    <span className="text-gray-400 text-sm">
                      Page {pageNumber}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
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
