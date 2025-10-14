"use client";

import { Clock } from "lucide-react";
import { lazy, memo, Suspense } from "react";
import { Highlight } from "./types";
import type { PdfPreviewImplProps } from "./pdf-preview-impl";

const PdfPreview = memo(
  ({
    url,
    highlight,
    fileName,
    toolbarClassName,
    onRemove,
    maxPages,
    maxPagesWarning,
  }: {
    url: string;
    highlight?: Highlight;
    fileName?: string;
    toolbarClassName?: string;
    onRemove?: () => void;
    maxPages?: number;
    maxPagesWarning?: string;
  }) => {
    if (typeof window === "undefined") {
      return null;
    }
    const PdfPreviewLazy = lazy<React.ComponentType<PdfPreviewImplProps>>(() =>
      import("./pdf-preview-impl").then((module) => ({
        default: module.PdfPreviewImpl,
      }))
    );
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
          highlight={highlight}
          fileName={fileName}
          toolbarClassName={toolbarClassName}
          onRemove={onRemove}
          maxPages={maxPages}
          maxPagesWarning={maxPagesWarning}
        />
      </Suspense>
    );
  }
);

export { PdfPreview };
