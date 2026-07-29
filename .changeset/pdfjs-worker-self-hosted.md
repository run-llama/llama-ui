---
"@llamaindex/ui": minor
---

Load pdf.js runtime assets from the app's own origin instead of unpkg

The PDF viewer configured `pdfjs.GlobalWorkerOptions.workerSrc` to
`//unpkg.com/pdfjs-dist@<version>/build/pdf.worker.min.mjs`, and pointed
`cMapUrl`/`wasmUrl` at the same CDN. The worker executes with the host page's
privileges, so a hijacked or compromised CDN response had full access to the
application origin — on every page that previews a document.

The worker is now resolved from the `pdfjs-dist` package installed alongside
this library, so bundlers emit it as a same-origin asset. Applications can drop
`https://unpkg.com` from their CSP `script-src`/`worker-src`.

`configurePdfjs()` is exported from `@llamaindex/ui/file-preview` to point the
viewer at self-hosted assets explicitly.

Behaviour change: `cMapUrl` and `wasmUrl` are no longer set by default, because
they are directories that bundlers cannot resolve automatically. PDFs using
CID-keyed fonts (typically CJK) and JPEG 2000 images need those assets copied
out of `pdfjs-dist` into your static files and registered — see the "PDF viewer
assets" section of the package README.
