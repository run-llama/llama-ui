/**
 * Test cases for helper.ts functions
 * Testing API calls, event streaming, and utility functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getRunningHandlers,
  getExistingHandler,
  createTask,
  fetchHandlerEvents,
  sendEventToHandler,
} from "../../../src/workflow-task/store/helper";
import { workflowStreamingManager } from "../../../src/lib/shared-streaming";
import type {
  TaskParams,
  WorkflowEvent,
} from "../../../src/workflow-task/types";

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

  const mockTask: TaskParams = {
    task_id: "task-123",
    session_id: "session-456",
    service_id: "workflow-service",
    input: "test input",
  };

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
            { handler_id: "h-1", status: "running" },
            { handler_id: "h-2", status: "completed" },
            { handler_id: "h-3", status: "running" },
          ],
        },
      } as any);

      const result = await getRunningHandlers({ client: mockClient });
      expect(getHandlers).toHaveBeenCalledWith({ client: mockClient });
      expect(result).toEqual([
        { handler_id: "h-1", status: "running" },
        { handler_id: "h-3", status: "running" },
      ]);
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
        data: { handlers: [{ handler_id: "h-1" }, { handler_id: "h-2" }] },
      } as any);
      const result = await getExistingHandler({
        client: mockClient,
        handlerId: "h-2",
      });
      expect(result).toEqual({ handler_id: "h-2" });
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

  describe("createTask", () => {
    it("creates a handler via nowait endpoint", async () => {
      const { postWorkflowsByNameRunNowait } = await import(
        "@llamaindex/workflows-client"
      );
      vi.mocked(postWorkflowsByNameRunNowait as any).mockResolvedValue({
        data: { handler_id: "h-1", status: "started" },
      } as any);

      const result = await createTask({
        client: mockClient,
        workflowName: "test-deployment",
        eventData: { test: "data" },
      });

      expect(result).toEqual({ handler_id: "h-1", status: "started" });
      expect(postWorkflowsByNameRunNowait).toHaveBeenCalledWith({
        client: mockClient,
        path: { name: "test-deployment" },
        body: { start_event: JSON.stringify({ test: "data" }) },
      });
    });
  });

  describe("fetchHandlerEvents (NDJSON streaming)", () => {
    function makeReaderFromChunks(chunks: string[]) {
      let index = 0;
      return {
        read: async () => {
          if (index < chunks.length) {
            const value = new TextEncoder().encode(chunks[index++]);
            return { done: false, value } as const;
          }
          return { done: true, value: undefined } as const;
        },
        releaseLock: vi.fn(),
      };
    }

    it("streams NDJSON, emits onData, stops on StopEvent", async () => {
      const { getEventsByHandlerId } = await import(
        "@llamaindex/workflows-client"
      );

      const ndjsonLines = [
        JSON.stringify({
          __is_pydantic: true,
          value: { step: "step1" },
          qualified_name: "workflow.step.start",
        }) + "\n",
        JSON.stringify({
          __is_pydantic: true,
          value: { step: "step1", result: "success" },
          qualified_name: "workflow.step.complete",
        }) + "\n",
        JSON.stringify({
          __is_pydantic: true,
          value: {},
          qualified_name: "workflow.events.StopEvent",
        }) + "\n",
      ];

      vi.mocked(getEventsByHandlerId as any).mockResolvedValue({
        data: undefined,
        response: {
          ok: true,
          body: { getReader: () => makeReaderFromChunks(ndjsonLines) },
        },
      } as any);

      // Make subscribe call executor directly to exercise parsing
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
        "../../../src/workflow-task/store/helper"
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
      expect(mockCallback.onFinish).toHaveBeenCalledWith(result);
      expect(result).toHaveLength(3);
    });

    it("supports AbortSignal to cancel stream", async () => {
      const { getEventsByHandlerId } = await import(
        "@llamaindex/workflows-client"
      );

      // A long chunk sequence to allow abort before completion
      const ndjsonLines = new Array(10).fill(0).map(
        (_, i) =>
          JSON.stringify({
            __is_pydantic: true,
            value: { idx: i },
            qualified_name: "workflow.step.progress",
          }) + "\n"
      );

      vi.mocked(getEventsByHandlerId as any).mockResolvedValue({
        data: undefined,
        response: {
          ok: true,
          body: { getReader: () => makeReaderFromChunks(ndjsonLines) },
        },
      } as any);

      vi.mocked(workflowStreamingManager.subscribe).mockImplementation(
        (
          _key: string,
          subscriber: any,
          executor: any,
          signal?: AbortSignal
        ) => {
          const controller = new AbortController();
          const usedSignal = signal ?? controller.signal;
          // abort immediately after first tick
          setTimeout(() => controller.abort(), 0);
          const promise = executor(subscriber, usedSignal);
          return { promise, unsubscribe: vi.fn() } as any;
        }
      );

      const abortController = new AbortController();
      const { fetchHandlerEvents } = await import(
        "../../../src/workflow-task/store/helper"
      );

      await expect(
        fetchHandlerEvents({
          client: mockClient,
          handlerId: "handler-123",
          signal: abortController.signal,
        })
      ).rejects.toThrow();
    });

    it("propagates errors from network", async () => {
      const { getEventsByHandlerId } = await import(
        "@llamaindex/workflows-client"
      );

      vi.mocked(getEventsByHandlerId as any).mockResolvedValue({
        data: undefined,
        response: { ok: false, status: 500 },
      } as any);

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
        "../../../src/workflow-task/store/helper"
      );

      await expect(
        fetchHandlerEvents({ client: mockClient, handlerId: "handler-500" })
      ).rejects.toThrow();
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
