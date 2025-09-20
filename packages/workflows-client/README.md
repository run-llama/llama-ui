# @llamaindex/workflows-client

TypeScript client for LlamaIndex Workflows server.

This package is an auto-generated SDK targeting the Workflows HTTP API provided by the Python server at `run-llama/workflows-py`.

Repository: `https://github.com/run-llama/workflows-py`

## Installation

```bash
pnpm add @llamaindex/workflows-client
# or
npm install @llamaindex/workflows-client
# or
yarn add @llamaindex/workflows-client
```

Peer requirements: a modern runtime (Node 18+/Browser) and Fetch-compatible environment.

## Quick Start

```ts
import { client } from "@llamaindex/workflows-client";

// Configure base URL and optional headers (e.g., auth)
client.setConfig({
  baseUrl: "http://localhost:8000",
  headers: {
    // Authorization: `Bearer <token>`
  },
});

// List available workflows
const { data: workflows } = await client.GET("/workflows");

// Run workflow synchronously
const runRes = await client.POST("/workflows/{name}/run", {
  params: { path: { name: "my-workflow" } },
  body: {
    // optional start event, context, kwargs
    context: { foo: "bar" },
    kwargs: { n: 1 },
  },
});

// Start workflow asynchronously (returns handler_id)
const nowait = await client.POST("/workflows/{name}/run-nowait", {
  params: { path: { name: "my-workflow" } },
  body: { context: {} },
});

// Fetch final result later
const result = await client.GET("/results/{handler_id}", {
  params: { path: { handler_id: nowait.data?.handler_id! } },
});

// Stream events (SSE or ndjson)
const events = await client.GET("/events/{handler_id}", {
  params: { path: { handler_id: nowait.data?.handler_id! }, query: { sse: true } },
});
```

### Helper API (typed wrappers)

Besides the generic `client.GET/POST` interface, typed convenience wrappers are exported under `sdk`:

```ts
import {
  createClient,
  createConfig,
  getWorkflows,
  postWorkflowsByNameRun,
  postWorkflowsByNameRunNowait,
  getResultsByHandlerId,
  getEventsByHandlerId,
  getHealth,
} from "@llamaindex/workflows-client";

const wfClient = createClient(createConfig({ baseUrl: "http://localhost:8000" }));
const { data: names } = await getWorkflows({ client: wfClient });
```

## API Surface

- Low-level typed REST methods via `client.GET/POST` (path templating supported)
- Generated helper functions in `sdk` for common endpoints
- Server-Sent Events utilities for streaming

See `src/generated/sdk.gen.ts` for the full set of exported functions.

## Regenerating the SDK

This package is generated from the OpenAPI schema in `workflows-py`.

Prerequisites: have the upstream repository and OpenAPI schema available.

```bash
# In this package directory
pnpm install

# Update OpenAPI schema (from workflows-py)
# Place or fetch the schema into openapi.json, then run:
pnpm build
```

The generation pipeline uses `@hey-api/openapi-ts` via local scripts defined in `package.json`. The `build` step compiles the generated sources.

## License

MIT

