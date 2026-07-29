# @llamaindex/ui

[![codecov](https://codecov.io/gh/run-llama/llama-ui/branch/main/graph/badge.svg)](https://codecov.io/gh/run-llama/llama-ui)

React component library for LlamaIndex applications. Built with TypeScript, Vite, Tailwind CSS v4, Radix UI, and Storybook. Ships as a shadcn/ui-style library with both full-package and individual component consumption.

## Installation

```bash
pnpm add @llamaindex/ui
# or
npm install @llamaindex/ui
# or
yarn add @llamaindex/ui
```

Peer dependencies you should already have in your app:

- `react` and `react-dom` (v18)
- `llama-cloud-services`
- `@llamaindex/workflows-client`

### Tailwind v4 styles

Import the library stylesheet:

```css
/* e.g. src/index.css, app/globals.css */
@import "@llamaindex/ui/styles.css";
```

## Usage

### Basic import

```tsx
import { Button, Card } from "@llamaindex/ui";

export function Example() {
  return (
    <Card className="p-6">
      <Button>Click me</Button>
    </Card>
  );
}
```

### Using API clients via context

Many components and hooks use API clients provided by context. Wrap your app with `ApiProvider` and pass clients. Then components can access clients via hooks instead of explicit `client` props.

```tsx
import {
  ApiProvider,
  createCloudAgentClient,
  cloudApiClient,
  workflowsClient,
} from "@llamaindex/ui/lib";
import { ItemGrid } from "@llamaindex/ui/item-grid";

const clients = {
  agentDataClient: createCloudAgentClient({
    agentUrlId: "your-agent-url-id",
    collection: "your-collection",
  }),
  cloudApiClient,
  workflowsClient,
};

export function App() {
  return (
    <ApiProvider clients={clients}>
      <ItemGrid defaultPageSize={20} />
    </ApiProvider>
  );
}
```

### PDF viewer assets

`PdfPreview`, `FilePreview` and `DocumentPreview` render PDFs with
[react-pdf](https://github.com/wojtekmaj/react-pdf), which needs a pdf.js
worker at runtime. The library resolves it from the `pdfjs-dist` package
installed alongside it, so your bundler emits it as a **same-origin** asset —
nothing is loaded from a public CDN. The worker runs with your page's
privileges, so serve it from an origin you control and keep your CSP
`script-src`/`worker-src` limited to `'self'`.

Two optional asset sets are **not** enabled by default, because they are
directories that bundlers cannot resolve automatically:

- `cmaps/` — required to render PDFs that use CID-keyed fonts (typically CJK
  documents). Without it those glyphs come out blank.
- `wasm/` — required to decode JPEG 2000 (JPX) images.

To enable them, copy the directories out of `pdfjs-dist` into your static
assets at build time and point the library at them once during start-up:

```tsx
import { configurePdfjs } from "@llamaindex/ui/file-preview";

configurePdfjs({
  cMapUrl: "/pdfjs/cmaps/",
  wasmUrl: "/pdfjs/wasm/",
});
```

```jsonc
// package.json — copy the assets as part of your build
"scripts": {
  "prebuild": "cp -R node_modules/pdfjs-dist/cmaps node_modules/pdfjs-dist/wasm public/pdfjs/"
}
```

`configurePdfjs` also accepts `workerSrc`. Pass it if your bundler does not
rewrite `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`
inside dependencies; with Vite, for example,
`import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"` gives you a
URL to hand over. When the worker cannot be loaded at all, pdf.js falls back to
rendering on the main thread: slower, but still same-origin.

## Contributing

Please read the contribution guide: [CONTRIBUTING.md](https://github.com/run-llama/llama-ui/blob/main/CONTRIBUTING.md)
