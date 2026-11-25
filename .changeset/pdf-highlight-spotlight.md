---
"@llamaindex/ui": minor
---

PDF previews scroll to a highlight only when it is not already fully visible, and then center it. Stepping between highlights that are both on screen no longer moves the document.

Add `highlightStyle?: "outline" | "spotlight"` to `PdfPreview`, `FilePreview`, `DocumentPreview` and `PreviewComponentProps`. `"spotlight"` veils every PDF page and keeps only the highlighted areas sharp, each marked with a thin ring. The default `"outline"` keeps the existing look. The `HighlightStyle` type is exported.
