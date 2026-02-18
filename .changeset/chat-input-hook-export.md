---
"@llamaindex/ui": patch
---

Export `useChatInput` from the package chat entrypoint so consumers can directly use `const { handleSubmit } = useChatInput()` in custom chat input layouts.
