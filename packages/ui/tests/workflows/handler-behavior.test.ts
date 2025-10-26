import { describe, it, expect, vi, beforeEach } from "vitest";
import { Handler } from "../../src/workflows/store/handler";
import type { Handler as RawHandler } from "@llamaindex/workflows-client";
import {
  createClient,
  createConfig,
  type Client,
  getResultsByHandlerId,
  getHandlers,
} from "@llamaindex/workflows-client";
import {
  StopEvent,
  WorkflowEventType,
} from "../../src/workflows/store/workflow-event";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { ApiProvider, createMockClients } from "../../src/lib";
import {
  useHandlerStore,
  __resetHandlerStore,
  __setHandlerStoreState,
} from "../../src/workflows/hooks/use-handler-store";
import { renderHookWithProvider } from "../test-utils";
import { useObservedHandler } from "../../src/workflows/hooks/use-observed-handler";

// Mocks
vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual<
    typeof import("@llamaindex/workflows-client")
  >("@llamaindex/workflows-client");
  return {
    ...actual,
    getResultsByHandlerId: vi.fn(),
    getHandlers: vi.fn(),
  };
});

// Shared helpers
function createTestClient(): Client {
  return createClient(
    createConfig({
      baseUrl: "http://localhost:8000" as unknown as `${string}://${string}`,
    })
  );
}

function createRawHandler(overrides: Partial<RawHandler> = {}): RawHandler {
  return {
    handler_id: overrides.handler_id ?? "h-1",
    workflow_name: overrides.workflow_name ?? "wf",
    status: overrides.status ?? "running",
    started_at: overrides.started_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? null,
    completed_at: overrides.completed_at ?? null,
    error: overrides.error ?? null,
  } as RawHandler;
}

function getLatestEventSourceInstance(): any {
  const ES: any = (globalThis as any).EventSource;
  return ES.instances[ES.instances.length - 1];
}

function emitSseMessage(instance: any, payload: unknown): void {
  for (const cb of instance.listeners.message) {
    cb({ data: JSON.stringify(payload) });
  }
}

describe("Handler + Store behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetHandlerStore();
  });

  it("custom StopEvent subclass should complete and call onSuccess", async () => {
    const client = createTestClient();
    const handler = new Handler(
      createRawHandler({ handler_id: "h-sub" }),
      client
    );

    const onStart = vi.fn();
    const onData = vi.fn();
    const onSuccess = vi.fn();
    handler.subscribeToEvents({ onStart, onData, onSuccess });

    const es = getLatestEventSourceInstance();
    const customStopEvent = {
      type: "MyStopEvent",
      qualified_name: "some.package.MyStopEvent",
      types: [WorkflowEventType.StopEvent],
      value: { result: { ok: true } },
    };
    // Hydration from server upon stop
    vi.mocked(getResultsByHandlerId).mockResolvedValue({
      data: {
        handler_id: "h-sub",
        workflow_name: "wf",
        status: "completed",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error: null,
        result: customStopEvent,
      } as any,
      error: undefined,
      request: {} as Request,
      response: {} as Response,
    });
    emitSseMessage(es, customStopEvent);

    expect(onData).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(handler.status).toBe("completed");
    expect(handler.result).toBeInstanceOf(StopEvent);
  });

  it("empty StopEvent (cancel/error) should not call onSuccess and should surface error", async () => {
    const client = createTestClient();
    const handler = new Handler(
      createRawHandler({ handler_id: "h-err" }),
      client
    );

    const onSuccess = vi.fn();
    const onError = vi.fn();
    handler.subscribeToEvents({ onSuccess, onError });

    const es = getLatestEventSourceInstance();
    const emptyStopEvent = {
      type: "StopEvent",
      qualified_name: "llama_index.workflows.core.StopEvent",
      types: [WorkflowEventType.StopEvent],
      value: {},
    };
    // Server says failed
    vi.mocked(getResultsByHandlerId).mockResolvedValue({
      data: {
        handler_id: "h-err",
        workflow_name: "wf",
        status: "failed",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error: "Boom",
        result: null,
      } as any,
      error: undefined,
      request: {} as Request,
      response: {} as Response,
    });
    emitSseMessage(es, emptyStopEvent);

    await new Promise((r) => setTimeout(r, 0));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(handler.status).toBe("failed");
  });

  it("getResult should update handler instance fields (status, timestamps, result)", async () => {
    const client = createTestClient();
    const handler = new Handler(
      createRawHandler({ handler_id: "h-get" }),
      client
    );

    vi.mocked(getResultsByHandlerId).mockResolvedValue({
      data: {
        handler_id: "h-get",
        workflow_name: "wf",
        status: "completed",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error: null,
        result: {
          type: "MyStopEvent",
          qualified_name: "my.pkg.MyStopEvent",
          types: [WorkflowEventType.StopEvent],
          value: { result: { ok: true } },
        },
      } as any,
      error: undefined,
      request: {} as Request,
      response: {} as Response,
    });

    const result = await handler.getResult();
    // Expected behavior (fails today): method updates handler instance as well
    expect(result).toBeInstanceOf(StopEvent);
    expect(handler.result).toBeInstanceOf(StopEvent);
    expect(handler.completedAt).toBeTruthy();
    expect(handler.updatedAt).toBeTruthy();
    expect(handler.status).toBe("completed");
  });

  it("useHandlerStore should re-render when internal handler updates occur", async () => {
    const clients = createMockClients();

    // Mount a hook to obtain store API and initialize context
    const { result: storeHook } = renderHookWithProvider(
      () => useHandlerStore((s) => s),
      { apiClients: clients }
    );

    // Populate store via fetchRunningHandlers so listeners are attached
    const raw = createRawHandler({ handler_id: "h-react" });
    vi.mocked(getHandlers).mockResolvedValue({
      data: { handlers: [raw] } as any,
      error: undefined,
      request: {} as Request,
      response: {} as Response,
    });

    await act(async () => {
      await storeHook.current.fetchRunningHandlers();
    });

    const { result: selected } = renderHook(
      () => useHandlerStore((s) => s.handlers["h-react"]?.status ?? "none"),
      {
        wrapper: ({ children }) =>
          React.createElement(ApiProvider as any, { clients }, children as any),
      }
    );

    expect(selected.current).toBe("running");

    vi.mocked(getResultsByHandlerId).mockResolvedValue({
      data: {
        handler_id: "h-react",
        workflow_name: "wf",
        status: "completed",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error: null,
        result: {
          type: "StopEvent",
          qualified_name: "llama_index.workflows.core.StopEvent",
          types: [WorkflowEventType.StopEvent],
          value: { result: { ok: true } },
        },
      } as any,
      error: undefined,
      request: {} as Request,
      response: {} as Response,
    });

    const storeHandler = storeHook.current.handlers["h-react"]!;
    await act(async () => {
      await storeHandler.getResult();
    });
    expect(selected.current).toBe("completed");
  });

  it("useObservedHandler should re-render when a locally held Handler updates", async () => {
    const client = createTestClient();
    const handler = new Handler(
      createRawHandler({ handler_id: "h-local" }),
      client
    );

    // Mock server result so getResult triggers notifyChange
    vi.mocked(getResultsByHandlerId).mockResolvedValue({
      data: {
        handler_id: "h-local",
        workflow_name: "wf",
        status: "completed",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error: null,
        result: {
          type: "MyStopEvent",
          qualified_name: "my.pkg.MyStopEvent",
          types: [WorkflowEventType.StopEvent],
          value: { result: { ok: true } },
        },
      } as any,
      error: undefined,
      request: {} as Request,
      response: {} as Response,
    });

    const { result } = renderHook(() => {
      const observed = useObservedHandler(handler);
      return observed?.status;
    });

    expect(result.current).toBe("running");

    await act(async () => {
      await handler.getResult();
    });
    expect(result.current).toBe("completed");
  });
});
