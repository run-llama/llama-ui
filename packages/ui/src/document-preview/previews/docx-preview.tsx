"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileToolbar } from "../file-tool-bar";
import { downloadFile } from "../files";
import { usePreviewControls } from "./use-preview-controls";

interface DocxPreviewProps {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
  className?: string;
  scale?: number;
  onScaleChange?: (scale: number) => void;
}

const IFRAME_STYLES = `
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111827;
    line-height: 1.6;
    padding: 40px clamp(24px, 6vw, 56px);
    max-width: 880px;
    margin: 0 auto;
    font-size: 14px;
    word-wrap: break-word;
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 1.5em 0 0.4em;
    line-height: 1.3;
    color: #0f172a;
  }
  h1 { font-size: 1.75em; }
  h2 { font-size: 1.4em; }
  h3 { font-size: 1.2em; }
  h4, h5, h6 { font-size: 1em; }
  p { margin: 0 0 0.85em; }
  a { color: #0969da; }
  ul, ol { margin: 0.4em 0 0.9em 1.4em; padding: 0; }
  li { margin-bottom: 0.25em; }
  blockquote {
    border-left: 3px solid #d0d7de;
    margin: 0.8em 0;
    padding: 0.2em 0 0.2em 14px;
    color: #475569;
  }
  table {
    border-collapse: collapse;
    margin: 1em 0;
    max-width: 100%;
  }
  td, th {
    border: 1px solid #d0d7de;
    padding: 6px 10px;
    vertical-align: top;
    text-align: left;
  }
  th { background: #f6f8fa; font-weight: 600; }
  img { max-width: 100%; height: auto; display: block; margin: 0.6em 0; }
  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 1.4em 0; }
`;

function buildIframeDocument(bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${IFRAME_STYLES}</style></head><body>${bodyHtml}</body></html>`;
}

export function DocxPreview({
  fileName,
  contentUrl,
  onRemove,
  className,
  scale: scaleProp,
  onScaleChange,
}: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { scale, setScale, resetScale, toggleFullscreen } = usePreviewControls(
    containerRef,
    { scale: scaleProp, onScaleChange }
  );

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        setBodyHtml(null);
        resetScale();

        const response = await fetch(contentUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch document.");
        }
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;

        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (cancelled) return;

        setBodyHtml(result.value ?? "");
      } catch (error) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("[DocxPreview] Error rendering document:", error);
        setLoadError(
          error instanceof Error ? error.message : "Failed to render document"
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

  const iframeSrcDoc = useMemo(() => {
    if (bodyHtml === null) return null;
    return buildIframeDocument(bodyHtml);
  }, [bodyHtml]);

  if (isLoading) {
    return (
      <div className="relative flex h-full flex-col">
        <FileToolbar
          fileName={fileName}
          onDownload={onDownload}
          onRemove={onRemove}
        />
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">Loading document...</p>
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
          <p className="text-sm text-destructive">Failed to render document</p>
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
      <div className="flex-1 overflow-auto bg-white">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: `${inverseScale}%`,
            height: `${inverseScale}%`,
          }}
        >
          {/*
            Rendered inside a sandboxed iframe (no allow-scripts) so any
            script tags in the mammoth output are inert, and the document
            cannot navigate or talk to the parent frame.
          */}
          <iframe
            srcDoc={iframeSrcDoc ?? ""}
            sandbox="allow-same-origin"
            title={fileName ?? "DOCX Preview"}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
