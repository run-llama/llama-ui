import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs, PasswordResponses } from "react-pdf";
// @ts-expect-error react-pdf types have no declarations
import type { PageCallback } from "react-pdf/dist/shared/types";
import { logger } from "@shared/logger";
import { Button } from "@/base/button";
import { FileToolbar } from "../document-preview/file-tool-bar";
import { BoundingBoxOverlay } from "./bounding-box-overlay";
import type { BoundingBox, Highlight } from "./types";
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
  /** Optional page range to display (1-indexed, inclusive). Only pages within this range will be rendered. */
  pageRange?: [number, number];
  /** Controlled zoom. When both `scale` and `onScaleChange` are provided,
   *  the parent owns zoom state and the auto-fit-on-mount effect is skipped. */
  scale?: number;
  onScaleChange?: (scale: number) => void;
}

// map of page number to page viewport dimensions
type PageBaseDims = {
  [key: number]: { width: number; height: number };
};

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
};

// Cache passwords for encrypted PDFs so remounts don't re-prompt
const pdfPasswordCache = new Map<string, string>();

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
  pageRange,
  scale: scaleProp,
  onScaleChange,
}: PdfPreviewImplProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState<number>(pageRange?.[0] ?? 1);
  const isScaleControlled =
    scaleProp !== undefined && onScaleChange !== undefined;
  const [internalScale, setInternalScale] = useState<number>(1.0);
  const scale = isScaleControlled ? scaleProp : internalScale;
  const setScale = useCallback(
    (updater: number | ((prev: number) => number)) => {
      if (isScaleControlled) {
        const next =
          typeof updater === "function"
            ? (updater as (prev: number) => number)(scaleProp!)
            : updater;
        onScaleChange!(next);
      } else {
        setInternalScale(updater);
      }
    },
    [isScaleControlled, onScaleChange, scaleProp]
  );
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const passwordCancelled = useRef(false);
  const passwordPromptTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [pageBaseDims, setPageBaseDims] = useState<PageBaseDims>({}); // store page viewport to use for bounding box overlay
  const [showHighlights, setShowHighlights] = useState<boolean>(true); // whether to show the highlights
  const [visiblePages, setVisiblePages] = useState<Set<number>>(
    new Set([pageRange?.[0] ?? 1])
  );
  const [pageHeights, setPageHeights] = useState<{ [key: number]: number }>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [pendingHighlight, setPendingHighlight] = useState<Highlight | null>(
    null
  );
  const isInitialScaleSet = useRef<boolean>(false);
  const prevFitMode = useRef<FitMode>(fitMode);

  // Derived page range bounds (clamped to actual document size)
  const rangeStart = pageRange ? Math.max(1, pageRange[0]) : 1;
  const rangeEnd = pageRange
    ? Math.min(pageRange[1], numPages ?? pageRange[1])
    : (numPages ?? 1);

  const highlightsByPage = useMemo(
    () => groupHighlightsByPage(highlights),
    [highlights]
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoadError(null);
      const effectiveStart = pageRange ? Math.max(1, pageRange[0]) : 1;
      const effectiveEnd = pageRange
        ? Math.min(pageRange[1], numPages)
        : numPages;
      setCurrentPage(effectiveStart);
      const initialPages = calculateVisiblePageRange(
        effectiveStart,
        effectiveEnd,
        VIRTUALIZATION_BUFFER
      );
      setVisiblePages(new Set(initialPages));
    },
    [pageRange]
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    logger.error("Error loading PDF", error);
    setLoadError(
      error.message ||
        "Failed to load PDF. The file may be corrupted or too large."
    );
    setIsLoading(false);
  }, []);

  const onPassword = useCallback(
    (callback: (password: string | null) => void, reason: number) => {
      const cacheKey = file?.name;

      if (passwordCancelled.current) {
        callback(null);
        return;
      }

      if (reason === PasswordResponses.INCORRECT_PASSWORD) {
        // A cached password was wrong (file may have changed) — clear it
        if (cacheKey) pdfPasswordCache.delete(cacheKey);
        passwordCancelled.current = true;
        setIsLoading(false);
        setLoadError("Incorrect password entered for this PDF.");
        callback(null);
        return;
      }

      // Try cached password first (e.g. after component remount)
      const cached = cacheKey ? pdfPasswordCache.get(cacheKey) : undefined;
      if (cached) {
        callback(cached);
        return;
      }

      // Cancel any pending prompt from a previous mount (e.g. React Strict Mode
      // double-mounting) so the user only sees one prompt.
      if (passwordPromptTimeout.current !== null) {
        clearTimeout(passwordPromptTimeout.current);
      }

      passwordPromptTimeout.current = setTimeout(() => {
        passwordPromptTimeout.current = null;

        const displayName = fileName ?? "This PDF";
        const password = prompt(
          `"${displayName}" is password-protected. Please enter the password.`
        );

        if (password) {
          if (cacheKey) pdfPasswordCache.set(cacheKey, password);
          callback(password);
        } else {
          passwordCancelled.current = true;
          setIsLoading(false);
          setLoadError("This PDF is password-protected and was not unlocked.");
          callback(null);
          onRemove?.();
        }
      }, 50);
    },
    [onRemove, fileName, file]
  );

  // Navigate to specific page
  const goToPage = useCallback(
    (pageNumber: number) => {
      const targetPage = Math.min(Math.max(pageNumber, rangeStart), rangeEnd);
      setCurrentPage(targetPage);

      const visibleRange = calculateVisiblePageRange(
        targetPage,
        rangeEnd,
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
    [rangeStart, rangeEnd]
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
    const targetPage = Math.min(
      Math.max(firstHighlight.page, rangeStart),
      rangeEnd
    );

    // Ensure the page is in the visible set
    setCurrentPage(targetPage);
    const visibleRange = calculateVisiblePageRange(
      targetPage,
      rangeEnd,
      VIRTUALIZATION_BUFFER
    );
    setVisiblePages(new Set(visibleRange));
    setShowHighlights(true);

    setPendingHighlight({ ...firstHighlight, page: targetPage });
  }, [highlights, numPages, rangeStart, rangeEnd]);

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
    setCurrentPage((prev) => Math.min(Math.max(prev, rangeStart), rangeEnd));
    setVisiblePages((prev) => {
      const current = Math.min(
        Math.max(prev.size > 0 ? Math.max(...prev) : rangeStart, rangeStart),
        rangeEnd
      );
      const visibleRange = calculateVisiblePageRange(
        current,
        rangeEnd,
        VIRTUALIZATION_BUFFER
      );
      return new Set(visibleRange);
    });
  }, [numPages, rangeStart, rangeEnd]);

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
    [scale]
  );

  const firstPageDims = pageBaseDims[1];
  // Set initial scale once when first page dimensions are available, or when fitMode changes
  // The isInitialScaleSet flag prevents scale from being overwritten by page re-renders
  // (which happen on every zoom change), but allows re-scaling when fitMode is toggled
  useEffect(() => {
    // When scale is externally controlled, the parent owns zoom — don't clobber it on mount
    if (isScaleControlled) return;

    // Reset flag when fitMode changes to allow re-scaling
    if (prevFitMode.current !== fitMode) {
      isInitialScaleSet.current = false;
      prevFitMode.current = fitMode;
    }

    if (firstPageDims && containerRef.current && !isInitialScaleSet.current) {
      const newScale = calculateInitialScale(
        fitMode,
        { width: firstPageDims.width, height: firstPageDims.height },
        {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        }
      );
      setScale(newScale);
      isInitialScaleSet.current = true;
    }
  }, [fitMode, firstPageDims, isScaleControlled, setScale]);

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
                  let i = Math.max(
                    rangeStart,
                    pageNumber - VIRTUALIZATION_BUFFER
                  );
                  i <= Math.min(rangeEnd, pageNumber + VIRTUALIZATION_BUFFER);
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
  }, [numPages, rangeStart, rangeEnd]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const closestPage = findClosestPage(pageRefs.current, containerRect);

      const clampedPage = Math.min(Math.max(closestPage, rangeStart), rangeEnd);

      setCurrentPage(clampedPage);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [numPages, rangeStart, rangeEnd]);

  const lastLoadedUrl = useRef<string | null>(null);
  useEffect(() => {
    // prevent double effect runs that react likes to do in dev mode. Double load
    // Causes the pdf library to crash with file identity changing, and causes a lot of flickering.
    if (lastLoadedUrl.current === url) {
      return;
    }
    lastLoadedUrl.current = url;
    passwordCancelled.current = false;
    if (passwordPromptTimeout.current !== null) {
      clearTimeout(passwordPromptTimeout.current);
      passwordPromptTimeout.current = null;
    }
    setLoadError(null);
    setVisiblePages(new Set([pageRange?.[0] ?? 1]));
    setPageHeights({});
    isInitialScaleSet.current = false; // Reset so new document gets auto-scaled
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
  }, [url, fileName, pageRange]);

  // Handle keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentPage > rangeStart) {
          goToPage(currentPage - 1);
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (currentPage < rangeEnd) {
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
  }, [currentPage, rangeStart, rangeEnd, goToPage, setScale]);

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
    setCurrentPage(rangeStart);
    goToPage(rangeStart);
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

    // Pre-load first few pages of the range (instead of always pages 1-3)
    for (let i = rangeStart; i <= Math.min(rangeStart + 2, rangeEnd); i++) {
      pagesToInclude.add(i);
    }

    const bufferSize = 5;
    for (
      let i = Math.max(rangeStart, minVisible - bufferSize);
      i <= Math.min(rangeEnd, maxVisible + bufferSize);
      i++
    ) {
      pagesToInclude.add(i);
    }

    return {
      pages: Array.from(pagesToInclude).sort((a, b) => a - b),
      estimatedPageHeight,
    };
  }, [numPages, visiblePages, pageHeights, scale, rangeStart, rangeEnd]);

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
                passwordCancelled.current = false;
                setLoadError(null);
                if (!file) {
                  lastLoadedUrl.current = null;
                  setFile(null);
                }
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
          minPage={pageRange ? rangeStart : undefined}
          maxPage={pageRange ? rangeEnd : undefined}
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
          onPassword={onPassword}
          loading={null}
          options={pdfOptions}
        >
          {numPages && numPages > 0 && (
            <VirtualizedPageList
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
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
            />
          )}
        </Document>
      </div>
    </div>
  );
};

function VirtualizedPageList({
  rangeStart,
  rangeEnd,
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
}: {
  rangeStart: number;
  rangeEnd: number;
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
}) {
  const firstRenderedPage = pagesToRender[0] || rangeStart;
  const lastRenderedPage = pagesToRender[pagesToRender.length - 1] || rangeEnd;

  const heightBefore = useMemo(() => {
    let height = 0;
    for (let i = rangeStart; i < firstRenderedPage; i++) {
      height += (pageHeights[i] || estimatedPageHeight) + 16;
    }
    return height;
  }, [rangeStart, firstRenderedPage, pageHeights, estimatedPageHeight]);

  const heightAfter = useMemo(() => {
    let height = 0;
    for (let i = lastRenderedPage + 1; i <= rangeEnd; i++) {
      height += (pageHeights[i] || estimatedPageHeight) + 16;
    }
    return height;
  }, [lastRenderedPage, rangeEnd, pageHeights, estimatedPageHeight]);

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
