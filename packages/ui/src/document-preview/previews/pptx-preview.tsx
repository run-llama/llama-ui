"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileToolbar } from "../file-tool-bar";
import { downloadFile } from "../files";
import { usePreviewControls } from "./use-preview-controls";

interface PptxPreviewProps {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
  className?: string;
  scale?: number;
  onScaleChange?: (scale: number) => void;
}

interface SlideEntry {
  /** 1-based index as shown to the user. Hidden slides are skipped, so
   *  this may not match the slide's position in the original deck. */
  displayIndex: number;
  /** SVG string, or null if `pptx-svg` returned an ERROR for that slide. */
  svg: string | null;
}

export function PptxPreview({
  fileName,
  contentUrl,
  onRemove,
  className,
  scale: scaleProp,
  onScaleChange,
}: PptxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slides, setSlides] = useState<SlideEntry[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleExtraKeys = useCallback((event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setCurrentSlide((prev) => Math.max(0, prev - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setCurrentSlide((prev) =>
        Math.min(slidesLengthRef.current - 1, prev + 1)
      );
    }
  }, []);

  const slidesLengthRef = useRef(0);
  slidesLengthRef.current = slides.length;

  const { scale, setScale, resetScale, toggleFullscreen } = usePreviewControls(
    containerRef,
    {
      onKeyDown: handleExtraKeys,
      scale: scaleProp,
      onScaleChange,
    }
  );

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        setSlides([]);
        setCurrentSlide(0);
        resetScale();

        const response = await fetch(contentUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch presentation.");
        }
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;

        const { PptxRenderer } = await import("pptx-svg");
        const renderer = new PptxRenderer({ logLevel: "error" });
        await renderer.init();
        if (cancelled) return;

        const { slideCount } = await renderer.loadPptx(arrayBuffer);
        if (cancelled) return;

        // Hidden slides are skipped; failed slides are kept as null
        // placeholders so the displayed slide count stays stable.
        const entries: SlideEntry[] = [];
        let failedCount = 0;
        for (let i = 0; i < slideCount; i++) {
          if (cancelled) return;
          if (renderer.isSlideHidden(i)) continue;
          const svg = renderer.renderSlideSvg(i);
          if (typeof svg === "string" && !svg.startsWith("ERROR:")) {
            entries.push({ displayIndex: entries.length + 1, svg });
          } else {
            failedCount += 1;
            // eslint-disable-next-line no-console
            console.warn(
              `[PptxPreview] Failed to render slide ${i + 1}:`,
              typeof svg === "string" ? svg : "unknown error"
            );
            entries.push({ displayIndex: entries.length + 1, svg: null });
          }
        }

        if (!cancelled) {
          if (entries.length === 0) {
            throw new Error("Presentation has no renderable slides.");
          }
          if (failedCount > 0) {
            // eslint-disable-next-line no-console
            console.warn(
              `[PptxPreview] ${failedCount} of ${entries.length} slides failed to render`
            );
          }
          setSlides(entries);
        }
      } catch (error) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("[PptxPreview] Error rendering presentation:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to render presentation"
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [contentUrl, resetScale]);

  const onDownload = () => {
    downloadFile(contentUrl, fileName);
  };

  const handlePageChange = useCallback(
    (page: number) => {
      const nextIndex = Math.max(0, Math.min(slides.length - 1, page - 1));
      setCurrentSlide(nextIndex);
    },
    [slides.length]
  );

  const handleReset = useCallback(() => {
    resetScale();
    setCurrentSlide(0);
  }, [resetScale]);

  const currentEntry = useMemo(
    () => slides[currentSlide] ?? null,
    [slides, currentSlide]
  );

  const hasSlides = slides.length > 0;

  if (isLoading) {
    return (
      <div className="relative flex h-full flex-col">
        <FileToolbar
          fileName={fileName}
          onDownload={onDownload}
          onRemove={onRemove}
        />
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">
            Loading presentation...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative flex h-full flex-col">
        <FileToolbar
          fileName={fileName}
          onDownload={onDownload}
          onRemove={onRemove}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
          <p className="text-sm text-destructive">
            Failed to render presentation
          </p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
          <button
            type="button"
            onClick={onDownload}
            className="text-sm text-primary hover:underline"
          >
            Download File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full flex-col bg-gray-100 ${className ?? ""}`}
    >
      <FileToolbar
        fileName={fileName}
        onDownload={onDownload}
        onRemove={onRemove}
        currentPage={hasSlides ? currentSlide + 1 : undefined}
        totalPages={hasSlides ? slides.length : undefined}
        onPageChange={hasSlides ? handlePageChange : undefined}
        scale={scale}
        onScaleChange={setScale}
        onReset={handleReset}
        onFullscreen={toggleFullscreen}
      />
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {currentEntry?.svg ? (
          /*
           * SVG comes from the `pptx-svg` library after parsing a PPTX the
           * user owns (typically behind a presigned URL). Library output
           * is trusted; we don't inject user-authored scripts here.
           */
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
            className="flex items-center justify-center transition-transform [&>svg]:h-auto [&>svg]:w-auto [&>svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: currentEntry.svg }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded border border-dashed bg-white p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Slide {currentEntry?.displayIndex ?? currentSlide + 1} could not
              be rendered.
            </p>
            <p className="text-xs text-muted-foreground">
              This slide uses a feature the renderer doesn&apos;t support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
