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
OpenAPI schema will be downloaded automatically so please do not change it.


## License

MIT

