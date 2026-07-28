"use client";

/**
 * Where the PDF viewer loads pdf.js runtime assets from.
 *
 * These are deliberately *not* defaulted to a public CDN. The worker in
 * particular is a script that executes with the same privileges as the host
 * page, so a compromised or hijacked CDN response would have full access to
 * the application origin. Everything here should be served from an origin the
 * application controls.
 */
export interface PdfjsAssetConfig {
  /**
   * URL of the pdf.js worker script (`pdfjs-dist/build/pdf.worker.min.mjs`).
   * Must match the pdf.js version `react-pdf` was built against, otherwise
   * pdf.js refuses to use it.
   */
  workerSrc?: string;
  /**
   * Directory URL (with trailing slash) holding the pdf.js CMap files, i.e. a
   * copy of `pdfjs-dist/cmaps/`. Needed to render PDFs that use CID-keyed
   * fonts (most commonly CJK documents). Unset by default.
   */
  cMapUrl?: string;
  /**
   * Directory URL (with trailing slash) holding the pdf.js WebAssembly
   * modules, i.e. a copy of `pdfjs-dist/wasm/`. Needed to decode JPEG 2000
   * (JPX) images. Unset by default.
   */
  wasmUrl?: string;
}

/**
 * Resolve the worker from the `pdfjs-dist` package installed alongside this
 * library so the application's bundler emits it as a same-origin asset.
 *
 * The specifier is a static string literal because that is what bundlers
 * pattern-match on — do not build it dynamically. When the environment cannot
 * resolve it (notably the CJS build, where `import.meta` is unavailable) this
 * returns `undefined` and pdf.js falls back to its in-process "fake worker":
 * slower, but still same-origin. Callers that need the real worker in such an
 * environment should pass `workerSrc` to {@link configurePdfjs}.
 */
function resolveBundledWorkerSrc(): string | undefined {
  try {
    return new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  } catch {
    return undefined;
  }
}

let config: PdfjsAssetConfig = { workerSrc: resolveBundledWorkerSrc() };

// react-pdf warns when <Document options> changes identity between renders, so
// the object handed to it is rebuilt only when the configuration changes.
let documentOptions: { cMapUrl?: string; wasmUrl?: string } = {};

/**
 * Point the PDF viewer at self-hosted pdf.js assets. Call once during
 * application start-up, before any PDF is rendered.
 *
 * Copy the assets out of `pdfjs-dist` at build time (they ship with the
 * package) and serve them yourself:
 *
 * ```ts
 * import { configurePdfjs } from "@llamaindex/ui/file-preview";
 *
 * configurePdfjs({
 *   workerSrc: "/pdfjs/pdf.worker.min.mjs",
 *   cMapUrl: "/pdfjs/cmaps/",
 *   wasmUrl: "/pdfjs/wasm/",
 * });
 * ```
 *
 * Only the keys you pass are changed; omit `workerSrc` to keep the
 * bundler-resolved default.
 */
export function configurePdfjs(next: PdfjsAssetConfig): void {
  config = { ...config, ...next };
  documentOptions = { cMapUrl: config.cMapUrl, wasmUrl: config.wasmUrl };
}

/** @internal */
export function getPdfjsWorkerSrc(): string | undefined {
  return config.workerSrc;
}

/**
 * Stable-identity options object for react-pdf's `<Document options>`.
 * @internal
 */
export function getPdfDocumentOptions(): {
  cMapUrl?: string;
  wasmUrl?: string;
} {
  return documentOptions;
}
