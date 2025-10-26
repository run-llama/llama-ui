import { describe, it, expect, vi, beforeEach } from "vitest";
import { Handler } from "../../src/workflows/store/handler";
import type { Handler as RawHandler } from "@llamaindex/workflows-client";
import {
  createClient,
  createConfig,
  type Client,
  getResultsByHandlerId,
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

// Mocks
vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual<typeof import("@llamaindex/workflows-client")>(
    "@llamaindex/workflows-client"
  );
  return {
    ...actual,
    getResultsByHandlerId: vi.fn(),
  };
});

// Shared helpers
function createTestClient(): Client {
  return createClient(
    createConfig({ baseUrl: "http://localhost:8000" as unknown as `${string}://${string}` })
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

describe("Handler + Store behavior (failing tests to reproduce issues)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetHandlerStore();
  });

  it("custom StopEvent subclass should complete and call onSuccess", async () => {
    const client = createTestClient();
    const handler = new Handler(createRawHandler({ handler_id: "h-sub" }), client);

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
    emitSseMessage(es, customStopEvent);

    expect(onData).toHaveBeenCalledTimes(1);
    // Expected behavior (fails today if subclass not recognized properly)
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(handler.status).toBe("completed");
    expect(handler.result).toBeInstanceOf(StopEvent);
  });

  it("empty StopEvent (cancel/error) should not call onSuccess and should surface error", async () => {
    const client = createTestClient();
    const handler = new Handler(createRawHandler({ handler_id: "h-err" }), client);

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
    emitSseMessage(es, emptyStopEvent);

    // Expected behavior (fails today): not success
    expect(onSuccess).not.toHaveBeenCalled();
    // and error surfaced + status failed
    expect(onError).toHaveBeenCalledTimes(1);
    expect(handler.status).toBe("failed");
  });

  it("getResult should update handler instance fields (status, timestamps, result)", async () => {
    const client = createTestClient();
    const handler = new Handler(createRawHandler({ handler_id: "h-get" }), client);

    vi.mocked(getResultsByHandlerId).mockResolvedValue({
      data: {
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

    // Initialize the store by rendering once
    const { result } = renderHookWithProvider(() => useHandlerStore((s) => s), {
      apiClients: clients,
    });

    const handler = new Handler(createRawHandler({ handler_id: "h-react" }), clients.workflowsClient!);

    act(() => {
      __setHandlerStoreState((s) => ({ handlers: { ...s.handlers, [handler.handlerId]: handler } }));
    });

    const { result: selected, rerender } = renderHook(
      () =>
        useHandlerStore((s) => ({
          count: Object.keys(s.handlers).length,
          target: s.handlers["h-react"],
        })),
      {
        wrapper: ({ children }) => React.createElement(ApiProvider as any, { clients }, children as any),
      }
    );

    expect(selected.current.count).toBe(1);
    expect(selected.current.target?.status).toBe("running");

    act(() => {
      // Simulate internal mutation as would happen after getResult
      handler.status = "completed" as any;
      handler.completedAt = new Date();
    });

    rerender();
    expect(selected.current.target?.status).toBe("completed");
  });
});


