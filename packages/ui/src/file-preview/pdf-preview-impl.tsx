import { useState, useEffect, useRef, type ComponentType } from "react";
import { PdfNavigator } from "./pdf-navigator";

// NOTE: We intentionally avoid a static import of `react-pdf` here because the
// underlying `pdfjs-dist` package accesses browser-only globals (e.g.
// `DOMMatrix`) at module evaluation time, which will crash during
// server-side rendering.  Instead we dynamically load the library **only on the
// client** and store the components in state.

// Types for dynamically imported components
type ReactPdfModule = typeof import("react-pdf");

// Local component references (set after dynamic import)
const useReactPdf = () => {
  const [state, setState] = useState<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Document: ComponentType<any> | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Page: ComponentType<any> | null;
  }>({ Document: null, Page: null });

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safeguard

    let mounted = true;

    import("react-pdf").then((module: ReactPdfModule) => {
      if (!mounted) return;

      // Configure worker path
      module.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${module.pdfjs.version}/build/pdf.worker.min.mjs`;

      // Side-effect CSS imports – ignore TypeScript complaints
      // @ts-expect-error react-pdf CSS import has no types
      void import("react-pdf/dist/Page/AnnotationLayer.css");
      // @ts-expect-error react-pdf CSS import has no types
      void import("react-pdf/dist/Page/TextLayer.css");

      setState({ Document: module.Document, Page: module.Page });
    });

    return () => {
      mounted = false;
    };
  }, []);

  return state;
};

interface PdfPreviewImplProps {
  url: string;
  onDownload?: () => void;
}

export const PdfPreviewImpl = ({ url, onDownload }: PdfPreviewImplProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // fileLoadId is a workaround for this issue:
  // https://github.com/wojtekmaj/react-pdf/issues/974
  const [fileLoadId, setFileLoadId] = useState<number>(0);
  // Dynamically loaded react-pdf components
  const { Document: DocumentComponent, Page: PageComponent } = useReactPdf();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

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
      setFileLoadId((prev) => prev + 1);
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  if (isLoading || !DocumentComponent || !PageComponent) {
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
        <DocumentComponent
          key={fileLoadId}
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={isLoading}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => {
                pageRefs.current[index + 1] = el;
              }}
              className="mb-4 flex justify-center"
            >
              <PageComponent
                pageNumber={index + 1}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          ))}
        </DocumentComponent>
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
