import { describe, it, expect, vi, beforeEach } from "vitest";
import { Handler } from "../../src/workflows/store/handler";
import type { Handler as RawHandler } from "@llamaindex/workflows-client";
import {
  createClient,
  createConfig,
  type Client,
} from "@llamaindex/workflows-client";
import {
  WorkflowEventType,
  StopEvent,
} from "../../src/workflows/store/workflow-event";

describe("Handler streaming - custom StopEvent subclass", () => {
  let client: Client;

  beforeEach(() => {
    // fresh client; EventSource mock is set in tests/test-setup.ts
    client = createClient(
      createConfig({
        baseUrl: "http://localhost:8000" as unknown as `${string}://${string}`,
      })
    );
  });

  it("should mark handler completed when a custom StopEvent subclass is received", async () => {
    const rawHandler: RawHandler = {
      handler_id: "h-1",
      workflow_name: "wf",
      status: "running",
      started_at: new Date().toISOString(),
      updated_at: null,
      completed_at: null,
      error: null,
    };

    const handler = new Handler(rawHandler, client);

    const onStart = vi.fn();
    const onData = vi.fn();
    const onSuccess = vi.fn();
    const onComplete = vi.fn();

    handler.subscribeToEvents({ onStart, onData, onSuccess, onComplete });

    // Grab the EventSource instance created by subscribeToEvents
    const ES: any = (globalThis as any).EventSource;
    const esInstance = ES.instances[ES.instances.length - 1];

    // Simulate receiving a custom StopEvent subclass
    const customStopEvent = {
      type: "MyStopEvent", // subclass name (not equal to StopEvent)
      qualified_name: "some.package.MyStopEvent",
      types: [WorkflowEventType.StopEvent], // includes built-in StopEvent
      value: { ok: true },
    };

    // Dispatch a message to the EventSource listeners
    for (const cb of esInstance.listeners.message) {
      cb({ data: JSON.stringify(customStopEvent) });
    }

    // Expect onData to have been called for the message
    expect(onData).toHaveBeenCalledTimes(1);

    // The expectation of correct behavior (will FAIL with current implementation):
    // - onSuccess should be called because it's a StopEvent subclass
    // - handler.status should transition to completed
    // - handler.result should be populated as a StopEvent
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(handler.status).toBe("completed");
    expect(handler.result).toBeInstanceOf(StopEvent);
  });
});
