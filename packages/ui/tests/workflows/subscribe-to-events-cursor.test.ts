import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { useHandler } from "../../src/workflows/hooks";
import { renderHookWithProviderProps } from "../test-utils";
import { workflowStreamingManager } from "../../src/lib/shared-streaming";
import * as workflowsClient from "@llamaindex/workflows-client";

vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual<any>("@llamaindex/workflows-client");
  return {
    ...actual,
    getHandlersByHandlerId: vi.fn(),
    postEventsByHandlerId: vi.fn(),
    postHandlersByHandlerIdCancel: vi.fn(),
  };
});

// Re-declared so we can reach into the captured EventSource instances the mock
// from tests/test-setup.ts stores. Kept intentionally minimal.
interface MockEventSourceInstance {
  url: string;
  readyState: number;
  listeners: Record<string, Set<(e: any) => void>>;
  close: () => void;
}
interface MockEventSourceCtor {
  CLOSED: number;
  instances: MockEventSourceInstance[];
}

const getEventSourceCtor = (): MockEventSourceCtor =>
  (globalThis as any).EventSource as unknown as MockEventSourceCtor;

function dispatch(
  es: MockEventSourceInstance,
  type: "message" | "error",
  event: unknown
) {
  es.listeners[type]?.forEach((cb) => cb(event));
}

function makeMessage(data: unknown, lastEventId: string) {
  return { data: JSON.stringify(data), lastEventId };
}

function makeStartEnvelope(value: Record<string, unknown> = {}) {
  return {
    value,
    type: "StartEvent",
    types: [],
    qualified_name: "StartEvent",
  };
}

describe("subscribeToEvents cursor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fresh EventSource instance array per test.
    getEventSourceCtor().instances.length = 0;
    // The streaming manager is a module-level singleton; close any leftovers.
    workflowStreamingManager.closeAllStreams();

    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValue({
      data: {
        handler_id: "h-cursor",
        workflow_name: "wf",
        status: "running",
        started_at: new Date().toISOString(),
        error: "",
      },
      error: undefined,
    });
  });

  afterEach(() => {
    workflowStreamingManager.closeAllStreams();
  });

  it("passes afterSequence through to the request URL", async () => {
    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-cursor" },
      }
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    await act(async () => {
      result.current.subscribeToEvents({}, { afterSequence: 5 });
      // let the executor kick the EventSource ctor
      await Promise.resolve();
      await Promise.resolve();
    });

    const instances = getEventSourceCtor().instances;
    expect(instances).toHaveLength(1);
    expect(instances[0].url).toContain("after_sequence=5");
  });

  it("supports the legacy boolean includeInternal arg", async () => {
    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-cursor" },
      }
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    await act(async () => {
      result.current.subscribeToEvents({}, true);
      await Promise.resolve();
      await Promise.resolve();
    });

    const instances = getEventSourceCtor().instances;
    expect(instances).toHaveLength(1);
    expect(instances[0].url).toContain("include_internal=true");
    expect(instances[0].url).not.toContain("after_sequence");
  });

  it("omits after_sequence when no cursor is set and none passed", async () => {
    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-cursor" },
      }
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    await act(async () => {
      result.current.subscribeToEvents({});
      await Promise.resolve();
      await Promise.resolve();
    });

    const instances = getEventSourceCtor().instances;
    expect(instances).toHaveLength(1);
    expect(instances[0].url).not.toContain("after_sequence");
  });

  it("auto-resumes from the last observed sequence after teardown", async () => {
    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-cursor" },
      }
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    // First subscription — receive ids 1,2,3 then tear down.
    let firstOp!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      firstOp = result.current.subscribeToEvents({});
      await Promise.resolve();
      await Promise.resolve();
    });

    const instances = getEventSourceCtor().instances;
    expect(instances).toHaveLength(1);
    expect(instances[0].url).not.toContain("after_sequence");

    await act(async () => {
      for (const seq of ["1", "2", "3"]) {
        dispatch(
          instances[0],
          "message",
          makeMessage(makeStartEnvelope(), seq)
        );
      }
      firstOp.unsubscribe();
      await Promise.resolve();
    });

    // Second subscription — should include after_sequence=3.
    await act(async () => {
      result.current.subscribeToEvents({});
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(instances).toHaveLength(2);
    expect(instances[1].url).toContain("after_sequence=3");
  });

  it("explicit afterSequence wins over the stored cursor", async () => {
    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-cursor" },
      }
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    let firstOp!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      firstOp = result.current.subscribeToEvents({});
      await Promise.resolve();
      await Promise.resolve();
    });

    const instances = getEventSourceCtor().instances;
    await act(async () => {
      dispatch(instances[0], "message", makeMessage(makeStartEnvelope(), "7"));
      firstOp.unsubscribe();
      await Promise.resolve();
    });

    await act(async () => {
      result.current.subscribeToEvents({}, { afterSequence: "now" });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(instances[1].url).toContain("after_sequence=now");
    expect(instances[1].url).not.toContain("after_sequence=7");
  });

  it("flushes and clears the cursor when the server closes the stream (204)", async () => {
    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-cursor" },
      }
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    const onSuccess = vi.fn();
    const onComplete = vi.fn();

    let op!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      op = result.current.subscribeToEvents({ onSuccess, onComplete });
      await Promise.resolve();
      await Promise.resolve();
    });

    const instances = getEventSourceCtor().instances;
    await act(async () => {
      dispatch(instances[0], "message", makeMessage(makeStartEnvelope(), "9"));
      // Simulate py server closing the SSE stream: readyState CLOSED +
      // error event with no data.
      instances[0].readyState = getEventSourceCtor().CLOSED;
      dispatch(instances[0], "error", {});
      await op.promise;
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // A fresh subscription should not carry the cleared cursor forward.
    await act(async () => {
      result.current.subscribeToEvents({});
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(instances).toHaveLength(2);
    expect(instances[1].url).not.toContain("after_sequence");
  });
});
