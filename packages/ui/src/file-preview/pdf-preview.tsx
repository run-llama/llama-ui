"use client";

import { Clock } from "lucide-react";
import { lazy, memo, Suspense } from "react";
import { Highlight } from "./types";

const PdfPreview = memo(
  ({
    url,
    highlight,
    fileName,
  }: {
    url: string;
    highlight?: Highlight;
    fileName?: string;
  }) => {
    if (typeof window === "undefined") {
      return null;
    }
    const PdfPreviewLazy = lazy(() =>
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
        <PdfPreviewLazy url={url} highlight={highlight} fileName={fileName} />
      </Suspense>
    );
  }
);

export { PdfPreview };
