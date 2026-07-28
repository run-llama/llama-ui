import { createRequire } from "module";
import { readFileSync } from "fs";
import { globSync } from "glob";
import path from "path";
import { describe, expect, it, beforeEach, vi } from "vitest";

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(__dirname, "../..");

describe("pdfjs asset configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("pins pdfjs-dist to the exact build react-pdf uses", () => {
    // The worker we resolve from `pdfjs-dist` must be the same build as the
    // pdf.js API that react-pdf imports — pdf.js rejects a worker whose
    // version differs from the API's, which would break every PDF preview.
    const ownPkg = JSON.parse(
      readFileSync(path.join(packageRoot, "package.json"), "utf8")
    );
    const pinned = ownPkg.dependencies["pdfjs-dist"];
    expect(pinned).toMatch(/^\d+\.\d+\.\d+$/); // exact, not a range

    const reactPdfRequire = createRequire(
      require.resolve("react-pdf/package.json")
    );
    const resolved = JSON.parse(
      readFileSync(reactPdfRequire.resolve("pdfjs-dist/package.json"), "utf8")
    ).version;

    expect(pinned).toBe(resolved);
  });

  it("does not default any pdf.js asset to a third-party CDN", async () => {
    const { getPdfjsWorkerSrc, getPdfDocumentOptions } = await import(
      "../../src/file-preview/pdfjs-config"
    );

    // The worker executes with the host page's privileges, so whatever the
    // bundler resolves it to must stay on the app's own origin. CMaps and WASM
    // are opt-in, not CDN-backed.
    const workerSrc = getPdfjsWorkerSrc() ?? "";
    expect(new URL(workerSrc, window.location.href).origin).toBe(
      window.location.origin
    );
    expect(getPdfDocumentOptions()).toEqual({
      cMapUrl: undefined,
      wasmUrl: undefined,
    });
  });

  it("applies configured asset locations", async () => {
    const { configurePdfjs, getPdfjsWorkerSrc, getPdfDocumentOptions } =
      await import("../../src/file-preview/pdfjs-config");

    configurePdfjs({
      workerSrc: "/pdfjs/pdf.worker.min.mjs",
      cMapUrl: "/pdfjs/cmaps/",
      wasmUrl: "/pdfjs/wasm/",
    });

    expect(getPdfjsWorkerSrc()).toBe("/pdfjs/pdf.worker.min.mjs");
    expect(getPdfDocumentOptions()).toEqual({
      cMapUrl: "/pdfjs/cmaps/",
      wasmUrl: "/pdfjs/wasm/",
    });
  });

  it("merges partial configuration and keeps the default worker", async () => {
    const { configurePdfjs, getPdfjsWorkerSrc } = await import(
      "../../src/file-preview/pdfjs-config"
    );

    const defaultWorkerSrc = getPdfjsWorkerSrc();
    configurePdfjs({ cMapUrl: "/pdfjs/cmaps/" });

    expect(getPdfjsWorkerSrc()).toBe(defaultWorkerSrc);
  });

  it("keeps a stable <Document options> identity until reconfigured", async () => {
    const { configurePdfjs, getPdfDocumentOptions } = await import(
      "../../src/file-preview/pdfjs-config"
    );

    // react-pdf warns and reloads the document when `options` changes identity.
    expect(getPdfDocumentOptions()).toBe(getPdfDocumentOptions());

    const before = getPdfDocumentOptions();
    configurePdfjs({ cMapUrl: "/pdfjs/cmaps/" });
    expect(getPdfDocumentOptions()).not.toBe(before);
    expect(getPdfDocumentOptions()).toBe(getPdfDocumentOptions());
  });

  it("loads no runtime code from a public CDN anywhere in src", () => {
    const offenders = globSync("src/**/*.{ts,tsx}", { cwd: packageRoot })
      .filter((file) =>
        /\bunpkg\.com|\bcdn\.jsdelivr\.net|\bcdnjs\.cloudflare\.com/.test(
          readFileSync(path.join(packageRoot, file), "utf8")
        )
      )
      .sort();

    expect(offenders).toEqual([]);
  });
});
