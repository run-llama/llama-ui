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

## Contributing

Please read the contribution guide: [CONTRIBUTING.md](https://github.com/run-llama/llama-ui/blob/main/CONTRIBUTING.md)
