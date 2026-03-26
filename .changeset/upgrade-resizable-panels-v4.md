---
"@llamaindex/ui": minor
---

Upgrade react-resizable-panels from v3 to v4, fixing intermittent "No group found for id" SSR hydration errors. Define owned prop types for ResizablePanelGroup, ResizablePanel, and ResizableHandle to encapsulate the dependency. ResizablePanelGroup now accepts both `direction` (existing) and `orientation` (new) props. No breaking changes for consumers.
