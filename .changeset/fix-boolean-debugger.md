---
"@llamaindex/workflow-debugger": patch
---

Fix boolean field handling in workflow debugger schema editor:
- Fix incorrect display of boolean `false` values (was showing "True" for string "false")
- Initialize required boolean fields to prevent Pydantic validation errors for missing fields
- Add nullable boolean support with "None" option in the dropdown
- Only initialize required boolean fields; optional fields remain undefined
- For nullable boolean fields, initialize to `null` instead of `false`
