---
"@llamaindex/ui": minor
---

`subscribeToEvents` now auto-resumes at the last-seen sequence number after
unmount/remount, so no events are dropped in the gap. Adds an `afterSequence`
option for explicit cursor control (number, `"now"`, or `-1` to replay from
the beginning). The legacy `(callbacks, includeInternal)` boolean form still
works; prefer `(callbacks, { includeInternal })`. Server 204 "handler drained"
responses now cleanly terminate the subscriber instead of hanging.
