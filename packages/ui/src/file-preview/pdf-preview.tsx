"use client";

import { Clock } from "lucide-react";
import { lazy, memo, Suspense } from "react";
import type { PdfPreviewImplProps } from "./pdf-preview-impl";
import type { FitMode } from "./pdf-preview-utils";
import type { Highlight, HighlightStyle } from "./types";

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
    highlightStyle,
  }: {
    url: string;
    highlights?: Highlight[];
    fileName?: string | null;
    toolbarClassName?: string;
    onRemove?: () => void;
    /** How the PDF should fit on initial load. Defaults to "page" (fit entire page). */
    fitMode?: FitMode;
    /** Visual style for highlights. Defaults to "classic". */
    highlightStyle?: HighlightStyle;
  }) => {
    if (typeof window === "undefined") {
      return null;
    }
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Clock className="h-6 w-6 animate-pulse text-gray-400" />
            <span className="ml-2 text-gray-600">Loading PDF viewer...</span>
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
          highlightStyle={highlightStyle}
        />
      </Suspense>
    );
  }
);

export { PdfPreview };
