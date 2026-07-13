"use client";

import { useEffect, useRef, useState } from "react";
import { FileToolbar } from "../file-tool-bar";
import { downloadFile } from "../files";
import { usePreviewControls } from "./use-preview-controls";

interface HtmlPreviewProps {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
  className?: string;
  scale?: number;
  onScaleChange?: (scale: number) => void;
}

export function HtmlPreview({
  fileName,
  contentUrl,
  onRemove,
  className,
  scale: scaleProp,
  onScaleChange,
}: HtmlPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { scale, setScale, resetScale, toggleFullscreen } = usePreviewControls(
    containerRef,
    { scale: scaleProp, onScaleChange }
  );

  useEffect(() => {
    let cancelled = false;

    const fetchHtml = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        resetScale();

        const response = await fetch(contentUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch HTML file.");
        }
        const text = await response.text();
        if (!cancelled) {
          setHtmlContent(text);
        }
      } catch (error) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("[HtmlPreview] Error loading HTML content:", error);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load HTML content"
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchHtml();

    return () => {
      cancelled = true;
    };
  }, [contentUrl, resetScale]);

  const onDownload = () => {
    downloadFile(contentUrl, fileName);
  };

  if (isLoading) {
    return (
      <div className="relative flex h-full flex-col">
        <FileToolbar
          fileName={fileName}
          onDownload={onDownload}
          onRemove={onRemove}
        />
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">Loading HTML...</p>
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
          <p className="text-sm text-destructive">Failed to load HTML</p>
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

  const inverseScale = 100 / scale;

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full flex-col ${className ?? ""}`}
    >
      <FileToolbar
        fileName={fileName}
        onDownload={onDownload}
        onRemove={onRemove}
        scale={scale}
        onScaleChange={setScale}
        onReset={resetScale}
        onFullscreen={toggleFullscreen}
      />
      {/* Intentional paper: rendered HTML documents assume a white canvas. */}
      <div data-paper className="flex-1 overflow-auto bg-white">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: `${inverseScale}%`,
            height: `${inverseScale}%`,
          }}
        >
          <iframe
            srcDoc={htmlContent ?? ""}
            sandbox="allow-same-origin"
            title={fileName ?? "HTML Preview"}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
