# @llamaindex/ui

## 4.1.9

### Patch Changes

- 7cb60dd: use filename for password cache

## 4.1.8

### Patch Changes

- 21f0eef: support encrypted passwords

## 4.1.7

### Patch Changes

- 7dac626: Fix ChatInput resizing issue

## 4.1.6

### Patch Changes

- 78cdb71: update and add more base components

## 4.1.5

### Patch Changes

- edf8c12: Increase default max file size to 100MB and propagate to components
- c3a42c8: add file upload file purpose parameter

## 4.1.4

### Patch Changes

- 78f258a: Fix total_size access in paginated agent data API responses
- 1a49ef2: Fix Enter key behavior in file upload modal to submit form after file is selected instead of reopening file picker

## 4.1.3

### Patch Changes

- f2e81c0: Add client-side file hashing support to file upload
- 4d716f3: Add support for projectId and custom headers in cloud api client

## 4.1.2

### Patch Changes

- 2ba3dbd: update uploadzone border stying

## 4.1.1

### Patch Changes

- f9e4279: updating component discrepencies

## 4.1.0

### Minor Changes

- ee5f162: Replace llama-cloud-services with @llamaindex/llama-cloud

## 4.0.4

### Patch Changes

- 5ec20cd: spacing and border change for file upload

## 4.0.3

### Patch Changes

- 8a3aa29: remove fileurl upload

## 4.0.2

### Patch Changes

- 75bf6ed: update ui for upload

## 4.0.1

### Patch Changes

- 096da46: add maxsize for fileupload

## 4.0.0

### Major Changes

- db0982a: major version update. updating file-upload and document-preview with neew upload-zone component

### Minor Changes

- 30aa0fe: Improve PDF viewer highlight panning and add page fit prop

### Patch Changes

- a6c9e7b: Use the new input component
- 03adf7b: Change EmptyState to the new Empty
- 03c8db5: Use the new tooltip component
- 936c524: Use the new Select component
- 650dc36: Use the new button style
- 6020952: update dropdown to v2
- c767f5d: add table and dialog v2 component
- f547f64: Use new badge component
- 650dc36: style: increase height of file toolbar and PDF navigator for UI consistency

## 3.6.1

### Patch Changes

- 2a47997: Fix workflow store handling of failed workflow results to read the json result data from error HTTP responses.

## 3.6.0

### Minor Changes

- d0295bc: Adding support for file system files in document preview

## 3.5.6

### Patch Changes

- 7f6f79f: add image highlight support. add selectfile support for documentpreview

## 3.5.5

### Patch Changes

- b7dd856: Don't show delete/add for readonly fields in extracted data component

## 3.5.4

### Patch Changes

- 503ea32: fix: ensure using correct blob URL for document preview

## 3.5.3

### Patch Changes

- e19e192: update datadisplay to support hover

## 3.5.2

### Patch Changes

- 687286c: fix: Updated PropertyRenderer to conditionally show the '+' add button based on the editable prop.

## 3.5.1

### Patch Changes

- 54fbdf2: fix file upload max size helper text

## 3.5.0

### Minor Changes

- caa4c29: Introduce virtualization for pdfpreview. Remove maxpages for preview

## 3.4.1

### Patch Changes

- d5029e4: Fix preview width is cut off issue when enlarging the zoom level
- d5029e4: Fix layout of max pages warning message

## 3.4.0

### Minor Changes

- bd7527d: Updating pdfpreview for allowable max pages. Fix metadata-lookup to include citations

## 3.3.2

### Patch Changes

- 68edbac: chore: add separate image preview to document preview
- 68edbac: fix: download in object and text preview
- 68edbac: fix: Show file-type specific preview for S3 files (don't just fallback to object)
- 68edbac: fix: hydration error for select file bar (button inside button)
- 68edbac: fix: use sonner from consumer

## 3.3.1

### Patch Changes

- e2481f0: Support plugin-defined preview components
- e2481f0: Check allowed extension for URL file uploads
- 8c994a5: Add read/only renderer for nested list/tables

## 3.3.0

### Minor Changes

- bf1f472: Add support for agent workflow in debugger

## 3.2.2

### Patch Changes

- accf7eb: Fix export for document-preview

## 3.2.1

### Patch Changes

- 5c395e6: Add document-preview component

## 3.2.0

### Minor Changes

- 8544bc4: Add more functionality to workflow hooks

## 3.1.1

### Patch Changes

- 029e2ea: Fix WorkflowTrigger title ignored
- 35b0ca2: require latest version of workflows-client for peer dep

## 3.1.0

### Minor Changes

- ac461c9: Update PdfPreview to display multiple highlights

### Patch Changes

- ac461c9: Fix reloading issue on PdfPreview
- 3658344: Show toolbar while PDF is loading (so user can remove file)

## 3.0.0

### Major Changes

- 659ebae: Updates file upload UI to conform to new platform standards. Transfer tabs/input from platfrom to UI library. Add ability for file upload in UI. File upload is broken up into modular components and util files. Be sure to check and update current imports.

### Patch Changes

- 5578071: refactor workflow/handler store
- ee7de57: Make useItemData isMock optional
- 1d56861: Add filter/styles to grid
- d3423fd: Upgrade to better support react 19

## 3.0.0-alpha.0

### Major Changes

- 659ebae: Updates file upload UI to conform to new platform standards. Transfer tabs/input from platfrom to UI library. Add ability for file upload in UI. File upload is broken up into modular components and util files. Be sure to check and update current imports.

## 2.1.8

### Patch Changes

- aad82ca: Add maxPages to PdfPreview

## 2.1.7

### Patch Changes

- ef43b90: Change PdfPreview to automatically adjust the zoom to fit the available width.

## 2.1.6

### Patch Changes

- 0a795fb: Support for removing a file in PdfViewer

## 2.1.5

### Patch Changes

- 45ab264: Truncate overflowing text in file dialog
- 45ab264: Make workflow handler internal event inclusion configurable

## 2.1.4

### Patch Changes

- 5f61fdf: feat: update toolbar UI for PDF Preview

## 2.1.3

### Patch Changes

- 2e17c68: Add workflow debugger, and fix minor bugs in workflow hooks

## 2.1.2

### Patch Changes

- 3572aa1: Use SSE for streaming handler events
- e8b30a3: feat: implement pagination for table and list rendering

## 2.1.1

### Patch Changes

- 7be71a2: Export createWorkflowsClient

## 2.1.0

### Minor Changes

- 8962c8f: Add option to filter useWorkflowHandlerList by workflow name

## 2.0.0

### Major Changes

- f92ac01: Update terminology from tasks to handlers

## 1.0.3

### Patch Changes

- 72e8b9c: Update llama-cloud-services dependency to encourage moving off of deprecated agent_url_id

## 1.0.2

### Patch Changes

- 6b618d8: Bump workflows-client dependency

## 1.0.1

### Patch Changes

- 95b893c: Fix naming issue

## 1.0.0

### Major Changes

- 7510770: upgrade workflow v2 client sdk and related hooks

## 0.5.9

### Patch Changes

- f6ce884: feat: support display large pdf file with images

## 0.5.8

### Patch Changes

- 79fa4f3: use shadcn tooltip to show hover titles for schema fields

## 0.5.7

### Patch Changes

- 648bcf3: fix json value type issue

## 0.5.6

### Patch Changes

- 46bc176: Add warning for unsupported nested table/list

## 0.5.5

### Patch Changes

- bf0cb7f: feat: enhance pdf-viewer behavior

## 0.5.4

### Patch Changes

- 6d2f609: show full field value on hover if not editable

## 0.5.3

### Patch Changes

- 58e7ba2: Fix: Do not show the edit value popup when clicking on uneditable fields.

## 0.5.2

### Patch Changes

- 7317488: fix some bugs

## 0.5.1

### Patch Changes

- 55254c7: better shcema

## 0.5.0

### Minor Changes

- 1868f03: breaking changes for several elements, item grid, extracted-data-display, etc.

## 0.4.0

### Minor Changes

- 9bc94c1: Improve workflow trigger

## 0.3.5

### Patch Changes

- 75cc905: add custom workflow input

## 0.3.4

### Patch Changes

- 3a406c9: export api client

## 0.3.3

### Patch Changes

- 0533e5d: Add workflow trigger and workflow progress monitor

## 0.3.2

### Patch Changes

- 30ce12c: Add support for dereferencing and re-organizing json schemas

## 0.3.1

### Patch Changes

- b6eee29: Make llama cloud a peer dependency to avoid duplicates

## 0.3.0

### Minor Changes

- 38c6198: add more business components and export default shadcn base components

## 0.2.1

### Patch Changes

- c9a2766: add metadata

## 0.2.0

### Minor Changes

- c53bbf9: setup basic ui components

### Patch Changes

- 10db251: fix release ci
