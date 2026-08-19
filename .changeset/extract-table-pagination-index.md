---
"@llamaindex/ui": patch
---

Fix extract table citation paths on paginated pages

Paginated `TableRenderer` and `ListRenderer` rows used the page-local map
index for hover/click citation paths, so later pages looked up the first
page of `field_metadata`. Pagination now keeps each row's original index
in the full array.
