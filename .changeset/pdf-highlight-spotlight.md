---
"@llamaindex/ui": minor
---

Behaviour change: PDF previews no longer scroll on every `highlights` change. Consumers that relied on a highlight always re-centering the document will see it stay put when the highlight is already on screen.

- A highlight that is already fully visible does not move the document, so stepping between highlights that are both on screen keeps it still.
- A highlight that is out of view scrolls to the top of its page when the highlight is visible from there, and is centered otherwise. The horizontal position changes only when the highlight is off to the side.
- A page marker (a highlight under about 4 CSS px on both axes, such as the `{ x: 0, y: 0, width: 1, height: 1 }` box used for "go to page N") always aligns its page to the top of the preview and keeps the horizontal position.

The highlighted page still becomes the current page on every change, whether or not the document scrolls.

Add `highlightStyle?: "outline" | "spotlight"` to `PdfPreview`, `FilePreview`, `DocumentPreview` and `PreviewComponentProps`. `"spotlight"` veils every PDF page in translucent white and keeps only the highlighted areas sharp, each marked with a thin ring. The veil fades in unless the user prefers reduced motion, and is not shown when no highlight falls inside the rendered page range. The default `"outline"` keeps the existing look. The `HighlightStyle` type is exported.
