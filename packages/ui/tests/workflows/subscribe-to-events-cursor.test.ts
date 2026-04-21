import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { useHandler } from "../../src/workflows/hooks";
import { renderHookWithProviderProps } from "../test-utils";
import { workflowStreamingManager } from "../../src/lib/shared-streaming";
import { MockEventSource } from "../test-setup";
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

function makeStopEnvelope(result: unknown = null) {
  return {
    value: { result },
    type: "StopEvent",
    types: [],
    qualified_name: "StopEvent",
  };
}

// Each test uses a unique handler id so the module-level cursor map in
// handler.ts doesn't leak state across tests.
let nextHandlerId = 0;
const freshHandlerId = () => `h-cursor-${++nextHandlerId}`;

describe("subscribeToEvents cursor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances.length = 0;
    workflowStreamingManager.closeAllStreams();
  });

  afterEach(() => {
    workflowStreamingManager.closeAllStreams();
  });

  const mountRunningHandler = async () => {
    const id = freshHandlerId();
    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValue({
      data: {
        handler_id: id,
        workflow_name: "wf",
        status: "running",
        started_at: new Date().toISOString(),
        error: "",
      },
      error: undefined,
    });
    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      { initialProps: { id } }
    );
    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });
    const terminal = (
      status: "completed" | "failed" | "cancelled",
      extras: Record<string, unknown> = {}
    ) => {
      (workflowsClient.getHandlersByHandlerId as any).mockResolvedValue({
        data: {
          handler_id: id,
          workflow_name: "wf",
          status,
          started_at: new Date().toISOString(),
          error: "",
          ...extras,
        },
        error: undefined,
      });
    };
    return { result, terminal };
  };

  const nextEventSource = async () => {
    // Let the streaming manager's executor run and construct the EventSource.
    await Promise.resolve();
    await Promise.resolve();
    const es = MockEventSource.instances.at(-1);
    if (!es) throw new Error("expected an EventSource to have been created");
    return es;
  };

  it("passes afterSequence through to the request URL", async () => {
    const { result } = await mountRunningHandler();

    await act(async () => {
      result.current.subscribeToEvents({}, { afterSequence: 5 });
    });

    const es = await nextEventSource();
    expect(es.url).toContain("after_sequence=5");
  });

  it("supports the legacy boolean includeInternal arg", async () => {
    const { result } = await mountRunningHandler();

    await act(async () => {
      result.current.subscribeToEvents({}, true);
    });

    const es = await nextEventSource();
    expect(es.url).toContain("include_internal=true");
    expect(es.url).not.toContain("after_sequence");
  });

  it("omits after_sequence when no cursor is set and none passed", async () => {
    const { result } = await mountRunningHandler();

    await act(async () => {
      result.current.subscribeToEvents({});
    });

    const es = await nextEventSource();
    expect(es.url).not.toContain("after_sequence");
  });

  it("auto-resumes from the last observed sequence after teardown", async () => {
    const { result } = await mountRunningHandler();

    let firstOp!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      firstOp = result.current.subscribeToEvents({});
    });

    const first = await nextEventSource();
    expect(first.url).not.toContain("after_sequence");

    await act(async () => {
      for (const seq of ["1", "2", "3"]) {
        first.dispatch("message", makeMessage(makeStartEnvelope(), seq));
      }
      firstOp.unsubscribe();
      await Promise.resolve();
    });

    await act(async () => {
      result.current.subscribeToEvents({});
    });

    const second = await nextEventSource();
    expect(second).not.toBe(first);
    expect(second.url).toContain("after_sequence=3");
  });

  it("explicit afterSequence wins over the stored cursor", async () => {
    const { result } = await mountRunningHandler();

    let firstOp!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      firstOp = result.current.subscribeToEvents({});
    });
    const first = await nextEventSource();

    await act(async () => {
      first.dispatch("message", makeMessage(makeStartEnvelope(), "7"));
      firstOp.unsubscribe();
      await Promise.resolve();
    });

    await act(async () => {
      result.current.subscribeToEvents({}, { afterSequence: "now" });
    });
    const second = await nextEventSource();

    expect(second.url).toContain("after_sequence=now");
    expect(second.url).not.toContain("after_sequence=7");
  });

  it("flushes and clears the cursor when the server closes the stream (204)", async () => {
    const { result } = await mountRunningHandler();

    const onSuccess = vi.fn();
    const onComplete = vi.fn();

    let op!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      op = result.current.subscribeToEvents({ onSuccess, onComplete });
    });
    const first = await nextEventSource();

    await act(async () => {
      first.dispatch("message", makeMessage(makeStartEnvelope(), "9"));
      first.readyState = MockEventSource.CLOSED;
      first.dispatch("error", {});
      await op.promise;
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.subscribeToEvents({});
    });
    const second = await nextEventSource();
    expect(second).not.toBe(first);
    expect(second.url).not.toContain("after_sequence");
  });

  it("fires onSuccess on StopEvent when the handler completes", async () => {
    const { result, terminal } = await mountRunningHandler();
    terminal("completed");

    const onSuccess = vi.fn();
    const onError = vi.fn();

    let op!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      op = result.current.subscribeToEvents({ onSuccess, onError });
    });
    const es = await nextEventSource();

    await act(async () => {
      es.dispatch("message", makeMessage(makeStopEnvelope("ok"), "1"));
      await op.promise;
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("fires onError when the terminal status is failed", async () => {
    const { result, terminal } = await mountRunningHandler();
    terminal("failed", { error: "boom" });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    let op!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      op = result.current.subscribeToEvents({ onSuccess, onError });
    });
    const es = await nextEventSource();

    await act(async () => {
      es.readyState = MockEventSource.CLOSED;
      es.dispatch("error", {});
      await op.promise;
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("boom");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("resolves cleanly when the terminal status is cancelled", async () => {
    // The SharedStreamingManager composite subscriber doesn't forward
    // onCancel today, so we can't assert the callback — just verify the
    // cancelled branch of finish() resolves the promise without erroring.
    const { result, terminal } = await mountRunningHandler();
    terminal("cancelled");

    const onSuccess = vi.fn();
    const onError = vi.fn();

    let op!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      op = result.current.subscribeToEvents({ onSuccess, onError });
    });
    const es = await nextEventSource();

    await act(async () => {
      es.readyState = MockEventSource.CLOSED;
      es.dispatch("error", {});
      await op.promise;
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("closes the EventSource when the last subscriber unsubscribes", async () => {
    const { result } = await mountRunningHandler();

    let op!: ReturnType<typeof result.current.subscribeToEvents>;
    await act(async () => {
      op = result.current.subscribeToEvents({});
    });
    const es = await nextEventSource();
    expect(es.readyState).not.toBe(MockEventSource.CLOSED);

    await act(async () => {
      op.unsubscribe();
      await Promise.resolve();
    });

    expect(es.readyState).toBe(MockEventSource.CLOSED);
  });
});
