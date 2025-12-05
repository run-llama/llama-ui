"use client";

import { Clock } from "lucide-react";
import { lazy, memo, Suspense } from "react";
import type { PdfPreviewImplProps } from "./pdf-preview-impl";
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
    maxPages,
    maxPagesWarning,
    onMaxPagesChange,
  }: {
    url: string;
    highlights?: Highlight[];
    fileName?: string | null;
    toolbarClassName?: string;
    onRemove?: () => void;
    maxPages?: number;
    maxPagesWarning?: string;
    onMaxPagesChange?: (newMaxPages: number) => void;
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
          maxPages={maxPages}
          maxPagesWarning={maxPagesWarning}
          onMaxPagesChange={onMaxPagesChange}
        />
      </Suspense>
    );
  }
);

export { PdfPreview };
