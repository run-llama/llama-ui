import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// @ts-expect-error react-pdf types have no declarations
import type { PageCallback } from "react-pdf/dist/shared/types";
import { logger } from "@shared/logger";
import { Button } from "@/base/button";
import { FileToolbar } from "../document-preview/file-tool-bar";
import { BoundingBoxOverlay } from "./bounding-box-overlay";
import type { BoundingBox, Highlight, HighlightStyle } from "./types";
import {
  calculateHighlightScrollPosition,
  calculateInitialScale,
  calculateVisiblePageRange,
  findClosestPage,
  groupHighlightsByPage,
  type FitMode,
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
  /** How the PDF should fit on initial load. Defaults to "page" (fit entire page). */
  fitMode?: FitMode;
  /** Visual style for highlights. Defaults to "classic". */
  highlightStyle?: HighlightStyle;
}

// map of page number to page viewport dimensions
type PageBaseDims = {
  [key: number]: { width: number; height: number };
};

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
};

const VIRTUALIZATION_BUFFER = 5;
const DEFAULT_PAGE_HEIGHT = 800;
const MIN_HIGHLIGHT_EDGE_DISTANCE = 60; // Minimum pixels from viewport edge when scrolling to highlight
const PENDING_HIGHLIGHT_TIMEOUT_MS = 2000; // Max time to wait for page dimensions before giving up

export const PdfPreviewImpl = ({
  fileName,
  url,
  onDownload,
  onRemove,
  highlights,
  toolbarClassName,
  fitMode = "width",
  highlightStyle = "mist",
}: PdfPreviewImplProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const [pageBaseDims, setPageBaseDims] = useState<PageBaseDims>({}); // store page viewport to use for bounding box overlay
  const [showHighlights, setShowHighlights] = useState<boolean>(true); // whether to show the highlights
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const [pageHeights, setPageHeights] = useState<{ [key: number]: number }>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [pendingHighlight, setPendingHighlight] = useState<Highlight | null>(
    null
  );

  const highlightsByPage = useMemo(
    () => groupHighlightsByPage(highlights),
    [highlights]
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
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
      error.message ||
        "Failed to load PDF. The file may be corrupted or too large."
    );
    setIsLoading(false);
  }, []);

  // Navigate to specific page
  const goToPage = useCallback(
    (pageNumber: number) => {
      const maxPage = numPages ?? 1;
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
    [numPages]
  );

  // Scroll to show a highlight with smart positioning
  const scrollToHighlight = useCallback(
    (highlight: Highlight) => {
      const container = containerRef.current;
      const pageEl = pageRefs.current[highlight.page];
      const pageDims = pageBaseDims[highlight.page];

      if (!container || !pageEl || !pageDims) {
        return;
      }

      const targetScroll = calculateHighlightScrollPosition({
        pageTop: pageEl.offsetTop,
        pageHeight: pageDims.height * scale,
        highlightY: highlight.y,
        highlightHeight: highlight.height,
        scale,
        viewportHeight: container.clientHeight,
        scrollHeight: container.scrollHeight,
        minEdgeDistance: MIN_HIGHLIGHT_EDGE_DISTANCE,
      });

      // Only use smooth scroll for single-page navigation to avoid layout shift issues
      // during long-distance scrolls where virtualization loads/unloads pages
      const currentScrollPage = findClosestPage(
        pageRefs.current,
        container.getBoundingClientRect()
      );
      const pageDistance = Math.abs(currentScrollPage - highlight.page);
      const scrollBehavior = pageDistance <= 1 ? "smooth" : "instant";

      container.scrollTo({
        top: targetScroll,
        behavior: scrollBehavior,
      });
    },
    [scale, pageBaseDims]
  );

  // when highlights are set, navigate to the highlight's position
  useEffect(() => {
    if (!highlights || highlights.length === 0) return;
    if (!numPages) return;

    const firstHighlight = highlights[0];
    const targetPage = Math.min(Math.max(firstHighlight.page, 1), numPages);

    // Ensure the page is in the visible set
    setCurrentPage(targetPage);
    const visibleRange = calculateVisiblePageRange(
      targetPage,
      numPages,
      VIRTUALIZATION_BUFFER
    );
    setVisiblePages(new Set(visibleRange));
    setShowHighlights(true);

    setPendingHighlight({ ...firstHighlight, page: targetPage });
  }, [highlights, numPages]);

  useEffect(() => {
    if (!pendingHighlight) return;
    const targetPage = pendingHighlight.page;
    const pageEl = pageRefs.current[targetPage];
    const pageDims = pageBaseDims[targetPage];

    if (pageEl && pageDims) {
      scrollToHighlight(pendingHighlight);
      setPendingHighlight(null);
      return;
    }

    // Fallback: if page dimensions aren't available after timeout,
    // clear pending highlight and scroll to page instead
    const timeoutId = setTimeout(() => {
      setPendingHighlight(null);
      const el = pageRefs.current[targetPage];
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "center" });
      }
    }, PENDING_HIGHLIGHT_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [pendingHighlight, pageBaseDims, scrollToHighlight]);

  useEffect(() => {
    if (!numPages) return;
    setCurrentPage((prev) => Math.min(prev, numPages));
    setVisiblePages((prev) => {
      const current = Math.min(prev.size > 0 ? Math.max(...prev) : 1, numPages);
      const visibleRange = calculateVisiblePageRange(
        current,
        numPages,
        VIRTUALIZATION_BUFFER
      );
      return new Set(visibleRange);
    });
  }, [numPages]);

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
    },
    [scale, fitMode]
  );

  const firstPageDims = pageBaseDims[1];
  // rescale the zoom when fit mode changes, or the page dimensions change
  useEffect(() => {
    if (firstPageDims && containerRef.current) {
      const newScale = calculateInitialScale(
        fitMode,
        { width: firstPageDims.width, height: firstPageDims.height },
        {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        }
      );
      setScale(newScale);
    }
  }, [fitMode, firstPageDims]);

  // click anywhere on the page to hide the highlights
  const handleClickOnPage = () => {
    if (showHighlights) {
      setShowHighlights(false);
    }
  };

  useEffect(() => {
    if (!numPages || !containerRef.current) return;

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
                  i <= Math.min(numPages, pageNumber + VIRTUALIZATION_BUFFER);
                  i++
                ) {
                  newVisiblePages.add(i);
                }
              } else {
                const isNearVisible = Array.from(prevVisiblePages).some(
                  (p) => Math.abs(p - pageNumber) <= VIRTUALIZATION_BUFFER
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
      Object.entries(pageRefs.current).forEach(([_pageNumber, element]) => {
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
  }, [numPages]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const closestPage = findClosestPage(pageRefs.current, containerRect);

      const totalPages = numPages ?? closestPage;
      const clampedPage = Math.min(Math.max(closestPage, 1), totalPages);

      setCurrentPage(clampedPage);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [numPages]);

  const lastLoadedUrl = useRef<string | null>(null);
  useEffect(() => {
    // prevent double effect runs that react likes to do in dev mode. Double load
    // Causes the pdf library to crash with file identity changing, and causes a lot of flickering.
    if (lastLoadedUrl.current === url) {
      return;
    }
    lastLoadedUrl.current = url;
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
        const totalPages = numPages ?? currentPage;
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
  }, [currentPage, numPages, goToPage]);

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

  const pagesToRender = useMemo((): {
    pages: number[];
    estimatedPageHeight: number;
  } => {
    if (!numPages)
      return { pages: [], estimatedPageHeight: DEFAULT_PAGE_HEIGHT * scale };

    const knownHeights = Object.values(pageHeights);
    const estimatedPageHeight =
      knownHeights.length > 0
        ? knownHeights.reduce((a, b) => a + b, 0) / knownHeights.length
        : DEFAULT_PAGE_HEIGHT * scale;

    const minVisible = Math.min(...visiblePages);
    const maxVisible = Math.max(...visiblePages);

    const pagesToInclude = new Set<number>();

    for (let i = 1; i <= Math.min(3, numPages); i++) {
      pagesToInclude.add(i);
    }

    const bufferSize = 5;
    for (
      let i = Math.max(1, minVisible - bufferSize);
      i <= Math.min(numPages, maxVisible + bufferSize);
      i++
    ) {
      pagesToInclude.add(i);
    }

    return {
      pages: Array.from(pagesToInclude).sort((a, b) => a - b),
      estimatedPageHeight,
    };
  }, [numPages, visiblePages, pageHeights, scale]);

  const showLoadingOverlay = isLoading || (file && !numPages);

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
              label="Retry"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {showLoadingOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-50">
          <div className="bg-white shadow-lg rounded-2xl p-6 w-80 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Rendering PDF…
            </h2>

            <p className="text-xs text-gray-500">
              Large PDFs or those with heavy images may take longer to render.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Component */}
      {numPages && numPages > 0 ? (
        <FileToolbar
          fileName={fileName}
          currentPage={currentPage}
          totalPages={numPages}
          scale={scale}
          onPageChange={goToPage}
          onScaleChange={setScale}
          onDownload={handleDownload}
          onRemove={onRemove}
          onReset={handleReset}
          onFullscreen={toggleFullscreen}
          className={toolbarClassName}
        />
      ) : (
        <FileToolbar
          fileName={fileName}
          onRemove={onRemove}
          className={toolbarClassName}
        />
      )}

      <div
        ref={containerRef}
        className="overflow-auto h-full bg-[#F3F3F3] flex-1 min-h-0"
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          options={pdfOptions}
        >
          {numPages && numPages > 0 && (
            <VirtualizedPageList
              numPages={numPages}
              visiblePages={visiblePages}
              pagesToRender={pagesToRender.pages}
              estimatedPageHeight={pagesToRender.estimatedPageHeight}
              pageHeights={pageHeights}
              pageRefs={pageRefs}
              observerRef={observerRef}
              scale={scale}
              handleLoadPage={handleLoadPage}
              handleClickOnPage={handleClickOnPage}
              showHighlights={showHighlights}
              highlightsByPage={highlightsByPage}
              pageBaseDims={pageBaseDims}
              highlightStyle={highlightStyle}
            />
          )}
        </Document>
      </div>
    </div>
  );
};

function VirtualizedPageList({
  numPages,
  visiblePages,
  pagesToRender,
  estimatedPageHeight,
  pageHeights,
  pageRefs,
  observerRef,
  scale,
  handleLoadPage,
  handleClickOnPage,
  showHighlights,
  highlightsByPage,
  pageBaseDims,
  highlightStyle,
}: {
  numPages: number;
  visiblePages: Set<number>;
  pagesToRender: number[];
  estimatedPageHeight: number;
  pageHeights: { [key: number]: number };
  pageRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>;
  observerRef: React.MutableRefObject<IntersectionObserver | null>;
  scale: number;
  handleLoadPage: (page: PageCallback) => void;
  handleClickOnPage: () => void;
  showHighlights: boolean;
  highlightsByPage: { [page: number]: BoundingBox[] };
  pageBaseDims: PageBaseDims;
  highlightStyle: HighlightStyle;
}) {
  const firstRenderedPage = pagesToRender[0] || 1;
  const lastRenderedPage = pagesToRender[pagesToRender.length - 1] || numPages;

  const heightBefore = useMemo(() => {
    let height = 0;
    for (let i = 1; i < firstRenderedPage; i++) {
      height += (pageHeights[i] || estimatedPageHeight) + 16;
    }
    return height;
  }, [firstRenderedPage, pageHeights, estimatedPageHeight]);

  const heightAfter = useMemo(() => {
    let height = 0;
    for (let i = lastRenderedPage + 1; i <= numPages; i++) {
      height += (pageHeights[i] || estimatedPageHeight) + 16;
    }
    return height;
  }, [lastRenderedPage, numPages, pageHeights, estimatedPageHeight]);

  return (
    <>
      {heightBefore > 0 && (
        <div style={{ height: `${heightBefore}px` }} aria-hidden="true" />
      )}

      {pagesToRender.map((pageNumber) => {
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
                  loading=""
                  noData=""
                />
                {showHighlights &&
                  highlightsByPage[pageNumber] &&
                  pageBaseDims[pageNumber] && (
                    <BoundingBoxOverlay
                      boundingBoxes={highlightsByPage[pageNumber]}
                      zoom={scale}
                      containerWidth={pageBaseDims[pageNumber].width}
                      containerHeight={pageBaseDims[pageNumber].height}
                      highlightStyle={highlightStyle}
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
                    : { minHeight: `${estimatedPageHeight}px` }
                }
              >
                <span className="text-gray-400 text-sm">Page {pageNumber}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Spacer for pages after rendered range */}
      {heightAfter > 0 && (
        <div style={{ height: `${heightAfter}px` }} aria-hidden="true" />
      )}
    </>
  );
}
