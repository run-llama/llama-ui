import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PdfNavigator } from "./pdf-navigator";
import { BoundingBoxOverlay } from "./bounding-box-overlay";
import { BoundingBox, Highlight } from "./types";
import { PageCallback } from "react-pdf/dist/shared/types";

// Configure worker path for PDF.js
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// Side-effect CSS imports – ignore TypeScript complaints
// @ts-expect-error react-pdf CSS import has no types
import("react-pdf/dist/Page/AnnotationLayer.css");
// @ts-expect-error react-pdf CSS import has no types
import("react-pdf/dist/Page/TextLayer.css");

interface PdfPreviewImplProps {
  url: string;
  onDownload?: () => void;
  highlight?: Highlight;
}

// map of page number to page viewport dimensions
type PageBaseDims = {
  [key: number]: { width: number; height: number };
};

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
};

export const PdfPreviewImpl = ({
  url,
  onDownload,
  highlight,
}: PdfPreviewImplProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const isInitialScaleSet = useRef(false);

  const [pageBaseDims, setPageBaseDims] = useState<PageBaseDims>({}); // store page viewport to use for bounding box overlay
  const [showHighlight, setShowHighlight] = useState<boolean>(false); // whether to show the highlight

  // bounding box from highlight (only 1 highlight at a time for now)
  const boundingBoxes: BoundingBox[] = [
    {
      id: "highlight",
      x: highlight?.x || 0,
      y: highlight?.y || 0,
      width: highlight?.width || 0,
      height: highlight?.height || 0,
      color: "rgba(255, 215, 0, 0.25)",
    },
  ];

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  // when highlight is set, go to the page and show the highlight
  useEffect(() => {
    if (!highlight) return;
    if (!numPages) return;
    const pageEl = pageRefs.current[highlight.page];
    if (pageEl) {
      goToPage(highlight.page);
      setShowHighlight(true);
    }
  }, [highlight, numPages]);

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
      const newScale = containerWidth / viewport.width;
      setScale(newScale);
      isInitialScaleSet.current = true; // prevent further auto-scaling
    }
  };

  // click anywhere on the page to hide the highlight
  const handleClickOnPage = () => {
    if (showHighlight) {
      setShowHighlight(false);
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

      setCurrentPage(closestPage);
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
    const fetchFile = async () => {
      setIsLoading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      setFile(new File([blob], "document.pdf", { type: "application/pdf" }));
      setIsLoading(false);
    };
    fetchFile();
    return () => {
      setFile(null);
    };
  }, [url]);

  // Navigate to specific page
  const goToPage = (pageNumber: number) => {
    const pageElement = pageRefs.current[pageNumber];
    if (pageElement && containerRef.current) {
      pageElement.scrollIntoView({
        behavior: "instant",
        block: "center",
      });
    }
  };

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
        if (currentPage < (numPages || 1)) {
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
  }, [currentPage, numPages]);

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

  if (isLoading) {
    return (
      <div className="relative h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={containerRef} className="overflow-auto h-full">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={isLoading}
          options={pdfOptions}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => {
                pageRefs.current[index + 1] = el;
              }}
              className="mb-4 flex justify-center"
            >
              <div className="relative inline-block">
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onLoadSuccess={handleLoadPage}
                  onClick={handleClickOnPage}
                />
                {highlight &&
                  showHighlight &&
                  highlight.page === index + 1 &&
                  pageBaseDims[index + 1] && (
                    <BoundingBoxOverlay
                      boundingBoxes={boundingBoxes}
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

      {/* Navigation Component */}
      {numPages && (
        <PdfNavigator
          currentPage={currentPage}
          totalPages={numPages}
          scale={scale}
          onPageChange={goToPage}
          onScaleChange={setScale}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
