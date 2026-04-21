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
    return result;
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
    const result = await mountRunningHandler();

    await act(async () => {
      result.current.subscribeToEvents({}, { afterSequence: 5 });
    });

    const es = await nextEventSource();
    expect(es.url).toContain("after_sequence=5");
  });

  it("supports the legacy boolean includeInternal arg", async () => {
    const result = await mountRunningHandler();

    await act(async () => {
      result.current.subscribeToEvents({}, true);
    });

    const es = await nextEventSource();
    expect(es.url).toContain("include_internal=true");
    expect(es.url).not.toContain("after_sequence");
  });

  it("omits after_sequence when no cursor is set and none passed", async () => {
    const result = await mountRunningHandler();

    await act(async () => {
      result.current.subscribeToEvents({});
    });

    const es = await nextEventSource();
    expect(es.url).not.toContain("after_sequence");
  });

  it("auto-resumes from the last observed sequence after teardown", async () => {
    const result = await mountRunningHandler();

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
    const result = await mountRunningHandler();

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
    const result = await mountRunningHandler();

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
});
