---
"@llamaindex/ui": minor
---

Dark mode support for business components. Replaced hardcoded palette colors
(`text-gray-*`, `bg-white`, `border-gray-*`, status greens/reds/oranges) across
the extracted-data, document-preview, file-preview, file-upload, chat,
item-count, item-grid and workflows components with semantic theme tokens so
they render correctly under the `.dark` palette. Added `--success-muted`,
`--warning-muted`, `--destructive-muted`, `--info`/`--info-muted` and a
categorical `--viz-1..6` data-viz palette (light + dark), aligned the library's
`.dark` token values to the LlamaCloud brand, added a Storybook toolbar theme
toggle for dark-mode QA, and a lint guard that blocks raw palette color
utilities in components. Document "paper" surfaces (rendered DOCX/HTML/PDF)
intentionally stay light.
