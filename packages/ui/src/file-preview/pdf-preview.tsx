"use client";

// This wrapper is now a thin re-export so that other modules can continue to
// import `./pdf-preview` without being concerned about the internal
// implementation.  All SSR-safety is handled inside `PdfPreviewImpl`.

export { PdfPreviewImpl as PdfPreview } from "./pdf-preview-impl";
