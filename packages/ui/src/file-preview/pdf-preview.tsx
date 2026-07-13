"use client";

import { Clock } from "lucide-react";
import { lazy, memo, Suspense } from "react";
import type { PdfPreviewImplProps } from "./pdf-preview-impl";
import type { FitMode } from "./pdf-preview-utils";
import type { Highlight } from "./types";

const PdfPreviewLazy = lazy<React.ComponentType<PdfPreviewImplProps>>(() =>
  import("./pdf-preview-impl").then((module) => ({
    default: module.PdfPreviewImpl,
  }))
);

const PdfPreview = memo(
  ({
    url,
    highlights,
    fileName,
    toolbarClassName,
    onRemove,
    fitMode,
    pageRange,
    scale,
    onScaleChange,
    maxDevicePixelRatio,
    renderTextLayer,
  }: {
    url: string;
    highlights?: Highlight[];
    fileName?: string | null;
    toolbarClassName?: string;
    onRemove?: () => void;
    /** How the PDF should fit on initial load. Defaults to "page" (fit entire page). */
    fitMode?: FitMode;
    /** Optional page range to display (1-indexed, inclusive). Only pages within this range will be rendered. */
    pageRange?: [number, number];
    /** Controlled zoom. When both `scale` and `onScaleChange` are provided,
     *  the component defers to the parent for zoom state (including skipping
     *  the auto-fit-on-mount behavior). */
    scale?: number;
    onScaleChange?: (scale: number) => void;
    /** Cap on the canvas backing-store pixel ratio
     *  (`min(window.devicePixelRatio, maxDevicePixelRatio)`). Defaults to 1.5. */
    maxDevicePixelRatio?: number;
    /** Whether the selectable text layer is rendered (focused page only).
     *  Set `false` to disable text selection entirely. Defaults to `true`. */
    renderTextLayer?: boolean;
  }) => {
    if (typeof window === "undefined") {
      return null;
    }
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Clock className="h-6 w-6 animate-pulse text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading PDF viewer...
            </span>
          </div>
        }
      >
        <PdfPreviewLazy
          url={url}
          highlights={highlights}
          fileName={fileName}
          toolbarClassName={toolbarClassName}
          onRemove={onRemove}
          fitMode={fitMode}
          pageRange={pageRange}
          scale={scale}
          onScaleChange={onScaleChange}
          maxDevicePixelRatio={maxDevicePixelRatio}
          renderTextLayer={renderTextLayer}
        />
      </Suspense>
    );
  }
);

export { PdfPreview };
