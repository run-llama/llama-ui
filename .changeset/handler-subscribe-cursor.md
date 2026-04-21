---
"@llamaindex/ui": minor
---

`subscribeToEvents` now auto-resumes at the last-seen sequence number from workflow event stream after unmount/remount, so no events are dropped in the gap.
