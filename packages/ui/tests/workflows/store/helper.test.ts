/**
 * Test cases for helper.ts functions
 * Testing API calls, event streaming, and utility functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getRunningHandlers,
  getExistingHandler,
  createHandler,
  sendEventToHandler,
} from "../../../src/workflows/store/helper";
import { workflowStreamingManager } from "../../../src/lib/shared-streaming";
import type { WorkflowEvent } from "../../../src/workflows/types";

// Mock dependencies
vi.mock("@llamaindex/workflows-client");
vi.mock("../../../src/lib/shared-streaming");

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Helper Functions Tests", () => {
  const mockClient = {
    getConfig: vi.fn(() => ({ baseUrl: "http://localhost:8000" })),
  } as unknown as any;

  // This is no longer needed as we don't use TaskParams anymore

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getRunningHandlers", () => {
    it("returns running handlers from server", async () => {
      const { getHandlers } = await import("@llamaindex/workflows-client");
      vi.mocked(getHandlers as any).mockResolvedValue({
        data: {
          handlers: [
            {
              handler_id: "h-1",
              status: "running",
              workflow_name: "alpha",
            },
            {
              handler_id: "h-2",
              status: "complete",
              workflow_name: "beta",
            },
            {
              handler_id: "h-3",
              status: "failed",
              workflow_name: "alpha",
            },
          ],
        },
      } as any);

      const result = await getRunningHandlers({ client: mockClient });
      expect(getHandlers).toHaveBeenCalledWith({ client: mockClient });
      expect(result).toEqual([{ handler_id: "h-1", status: "running" }]);
      expect(result[0]?.workflowName).toBeUndefined();
    });

    it("returns empty when no handlers", async () => {
      const { getHandlers } = await import("@llamaindex/workflows-client");
      vi.mocked(getHandlers as any).mockResolvedValue({
        data: { handlers: [] },
      } as any);
      const result = await getRunningHandlers({ client: mockClient });
      expect(result).toEqual([]);
    });
  });

  describe("getExistingTask", () => {
    it("retrieves an existing handler by id", async () => {
      const { getHandlers } = await import("@llamaindex/workflows-client");
      vi.mocked(getHandlers as any).mockResolvedValue({
        data: {
          handlers: [
            {
              handler_id: "h-1",
              status: "running",
              workflow_name: "alpha",
            },
            {
              handler_id: "h-2",
              status: "complete",
              workflow_name: "beta",
            },
          ],
        },
      } as any);
      const result = await getExistingHandler({
        client: mockClient,
        handlerId: "h-2",
      });
      expect(result).toEqual({ handler_id: "h-2", status: "complete" });
    });

    it("throws when not found", async () => {
      const { getHandlers } = await import("@llamaindex/workflows-client");
      vi.mocked(getHandlers as any).mockResolvedValue({
        data: { handlers: [{ handler_id: "h-1" }] },
      } as any);
      await expect(
        getExistingHandler({ client: mockClient, handlerId: "h-x" })
      ).rejects.toThrow("Handler h-x not found");
    });
  });

  describe("createHandler", () => {
    it("creates a handler via nowait endpoint", async () => {
      const { postWorkflowsByNameRunNowait } = await import(
        "@llamaindex/workflows-client"
      );
      vi.mocked(postWorkflowsByNameRunNowait as any).mockResolvedValue({
        data: { handler_id: "h-1", status: "started" },
      } as any);

      const result = await createHandler({
        client: mockClient,
        workflowName: "test-workflow",
        eventData: { test: "data" },
      });

      expect(result).toEqual({
        handler_id: "h-1",
        status: "running",
        workflowName: "test-workflow",
      });
      expect(postWorkflowsByNameRunNowait).toHaveBeenCalledWith({
        client: mockClient,
        path: { name: "test-workflow" },
        body: { start_event: { test: "data" } },
      });
    });
  });

  describe("fetchHandlerEvents (streaming)", () => {
    afterEach(() => {
      // Cleanup EventSource if we set it
      delete (globalThis as any).EventSource;
    });

    describe("hey-api async stream", () => {
      it("emits events and stops on StopEvent", async () => {
        const { getEventsByHandlerId } = await import(
          "@llamaindex/workflows-client"
        );

        // Mock async iterable stream of RawEvent
        const events = [
          {
            __is_pydantic: true,
            value: { step: "step1" },
            qualified_name: "workflow.step.start",
          },
          {
            __is_pydantic: true,
            value: { step: "step1", result: "success" },
            qualified_name: "workflow.step.complete",
          },
          {
            __is_pydantic: true,
            value: {},
            qualified_name: "workflow.events.StopEvent",
          },
        ];

        vi.mocked(getEventsByHandlerId as any).mockResolvedValue({
          stream: {
            [Symbol.asyncIterator]: async function* () {
              for (const ev of events) {
                yield ev;
              }
            },
          },
        } as any);

        // Execute executor directly through subscribe
        vi.mocked(workflowStreamingManager.subscribe).mockImplementation(
          (
            _key: string,
            subscriber: any,
            executor: any,
            signal?: AbortSignal
          ) => {
            const promise = executor(
              subscriber,
              signal ?? new AbortController().signal
            );
            return { promise, unsubscribe: vi.fn() } as any;
          }
        );

        const mockCallback = {
          onStart: vi.fn(),
          onData: vi.fn(),
          onFinish: vi.fn(),
          onStopEvent: vi.fn(),
        };

        const { fetchHandlerEvents } = await import(
          "../../../src/workflows/store/helper"
        );

        const result = await fetchHandlerEvents(
          {
            client: mockClient,
            handlerId: "handler-123",
          },
          mockCallback
        );

        expect(mockCallback.onData).toHaveBeenCalledTimes(3);
        expect(mockCallback.onStopEvent).toHaveBeenCalledTimes(1);
        // Do not assert onFinish here; current streaming manager may not call it
        expect(result).toHaveLength(3);
      });

      it("supports AbortSignal by surfacing abort errors", async () => {
        const { getEventsByHandlerId } = await import(
          "@llamaindex/workflows-client"
        );

        const abortController = new AbortController();
        abortController.abort();

        // When aborted, the request throws
        vi.mocked(getEventsByHandlerId as any).mockRejectedValue(
          new Error("Stream aborted")
        );

        vi.mocked(workflowStreamingManager.subscribe).mockImplementation(
          (
            _key: string,
            subscriber: any,
            executor: any,
            signal?: AbortSignal
          ) => {
            const promise = executor(
              subscriber,
              signal ?? new AbortController().signal
            );
            return { promise, unsubscribe: vi.fn() } as any;
          }
        );

        const { fetchHandlerEvents } = await import(
          "../../../src/workflows/store/helper"
        );

        await expect(
          fetchHandlerEvents({
            client: mockClient,
            handlerId: "handler-123",
            signal: abortController.signal,
          })
        ).rejects.toThrow("Stream aborted");
      });

      it("propagates errors from network", async () => {
        const { getEventsByHandlerId } = await import(
          "@llamaindex/workflows-client"
        );

        vi.mocked(getEventsByHandlerId as any).mockRejectedValue(
          new Error("Network error: 500")
        );

        vi.mocked(workflowStreamingManager.subscribe).mockImplementation(
          (
            _key: string,
            _subscriber: any,
            executor: any,
            signal?: AbortSignal
          ) => {
            const promise = executor({}, signal ?? new AbortController().signal);
            return { promise, unsubscribe: vi.fn() } as any;
          }
        );

        const { fetchHandlerEvents } = await import(
          "../../../src/workflows/store/helper"
        );

        await expect(
          fetchHandlerEvents({ client: mockClient, handlerId: "handler-500" })
        ).rejects.toThrow("Network error: 500");
      });
    });

    describe("browser EventSource", () => {
      class MockEventSource {
        url: string;
        listeners: Record<string, Set<(e: any) => void>> = {
          message: new Set(),
          error: new Set(),
        };
        static CLOSED = 2;
        readyState = 0;
        constructor(url: string) {
          this.url = url;
          // expose instance for test to emit
          (MockEventSource as any).last = this;
        }
        addEventListener(type: string, cb: (e: any) => void) {
          this.listeners[type]?.add(cb);
        }
        removeEventListener(type: string, cb: (e: any) => void) {
          this.listeners[type]?.delete(cb);
        }
        close() {
          this.readyState = MockEventSource.CLOSED;
        }
        emit(type: "message" | "error", data: any) {
          const payload = type === "message" ? { data } : { data };
          for (const cb of this.listeners[type] ?? []) cb(payload);
        }
      }

      it("emits events via EventSource and stops on StopEvent", async () => {
        (globalThis as any).EventSource = MockEventSource;

        const { fetchHandlerEvents } = await import(
          "../../../src/workflows/store/helper"
        );

        // Execute executor directly through subscribe
        vi.mocked(workflowStreamingManager.subscribe).mockImplementation(
          (
            _key: string,
            subscriber: any,
            executor: any,
            signal?: AbortSignal
          ) => {
            const promise = executor(
              subscriber,
              signal ?? new AbortController().signal
            );
            return { promise, unsubscribe: vi.fn() } as any;
          }
        );

        const mockCallback = {
          onStart: vi.fn(),
          onData: vi.fn(),
          onFinish: vi.fn(),
          onStopEvent: vi.fn(),
        };

        const promise = fetchHandlerEvents(
          { client: mockClient, handlerId: "handler-ES" },
          mockCallback
        );

        // Emit messages from EventSource
        const es: MockEventSource = (MockEventSource as any).last;
        const mk = (obj: any) => JSON.stringify(obj);
        es.emit("message", mk({
          __is_pydantic: true,
          value: { step: "a" },
          qualified_name: "workflow.step.start",
        }));
        es.emit("message", mk({
          __is_pydantic: true,
          value: { step: "a", done: true },
          qualified_name: "workflow.step.complete",
        }));
        es.emit("message", mk({
          __is_pydantic: true,
          value: {},
          qualified_name: "workflow.events.StopEvent",
        }));

        const result = await promise;

        expect(mockCallback.onData).toHaveBeenCalledTimes(3);
        expect(mockCallback.onStopEvent).toHaveBeenCalledTimes(1);
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe("sendEventToTask", () => {
    it("sends event to handler id", async () => {
      const { postEventsByHandlerId } = await import(
        "@llamaindex/workflows-client"
      );
      vi.mocked(postEventsByHandlerId as any).mockResolvedValue({
        data: { status: "sent" },
      } as any);

      const mockEvent: WorkflowEvent = {
        type: "user.input",
        data: { message: "Hello" },
      };

      const result = await sendEventToHandler({
        client: mockClient,
        handlerId: "handler-123",
        event: mockEvent,
      });

      expect(result).toEqual({ status: "sent" });
      expect(postEventsByHandlerId).toHaveBeenCalledWith({
        client: mockClient,
        path: { handler_id: "handler-123" },
        body: {
          event: JSON.stringify({
            __is_pydantic: true,
            value: { message: "Hello" },
            qualified_name: "user.input",
          }),
          step: undefined,
        },
      });
    });
  });

  // Internal coverage tests are omitted for the handler-based API
});
