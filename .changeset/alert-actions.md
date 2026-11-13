---
"@llamaindex/ui": minor
---

`Alert` takes up to three actions: `primaryAction` (solid), `secondaryAction` (outline) and `tertiaryAction` (ghost), with the same shape as `Empty`'s actions. They sit right of the text in one row, primary rightmost. When the alert is too narrow, they wrap below the text, and if they still don't fit on one row, each row fills the alert's width with the primary on top.

`buttonLabel`, `onButtonClick` and `buttonVariant` keep working and render as before. Prefer the new props. When both are passed, the action props win and the `buttonLabel` button is not rendered.

Long titles and descriptions now wrap inside the alert instead of overflowing it at narrow widths. Titles no longer truncate to one line.
