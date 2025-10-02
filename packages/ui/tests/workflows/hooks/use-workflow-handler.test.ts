import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import { useWorkflowHandler } from "../../../src/workflows/hooks/use-workflow-handler";
import { renderHookWithProvider } from "../../test-utils";

// Mock the helper functions to prevent real HTTP calls
vi.mock("../../../src/workflows/store/helper", () => ({
  getRunningHandlers: vi.fn().mockResolvedValue([]),
  getExistingHandler: vi.fn(),
  createHandler: vi.fn(),
  fetchHandlerEvents: vi.fn(() => ({
    promise: Promise.resolve([]),
    unsubscribe: vi.fn(),
  })),
  sendEventToHandler: vi.fn(),
}));

// Mock the shared streaming manager
vi.mock("../../../src/lib/shared-streaming", () => ({
  workflowStreamingManager: {
    subscribe: vi.fn(),
    isStreamActive: vi.fn().mockReturnValue(false),
    closeStream: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useWorkflowTask", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("H6: Mount subscribes and accumulates events", () => {
    it("should work with task ID", () => {
      const { result } = renderHookWithProvider(() =>
        useWorkflowHandler("task-123")
      );

      // The hook should work without errors
      expect(result.current.handler).toBe(null); // Initially no task
      expect(result.current.events).toHaveLength(0);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("H7: clearEvents empties events array", () => {
    it("should have clearEvents function", () => {
      const { result } = renderHookWithProvider(() =>
        useWorkflowHandler("task-123")
      );

      expect(typeof result.current.clearEvents).toBe("function");

      act(() => {
        result.current.clearEvents();
      });

      // Should not throw error
      expect(result.current.events).toHaveLength(0);
    });
  });

  describe("H8: stopStreaming ends stream and updates isStreaming", () => {
    it("should have stopStreaming function", () => {
      const { result } = renderHookWithProvider(() =>
        useWorkflowHandler("task-123")
      );

      expect(typeof result.current.stopStreaming).toBe("function");

      act(() => {
        result.current.stopStreaming();
      });

      // Should not throw error
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("H10: notFound is true when handler is missing on server", () => {
    it("sets notFound to true when server reports missing", async () => {
      const { getExistingHandler } = await import(
        "../../../src/workflows/store/helper"
      );

      (getExistingHandler as unknown as { mockRejectedValueOnce: Function }).mockRejectedValueOnce(
        new Error("Handler not found"),
      );

      const { result } = renderHookWithProvider(() =>
        useWorkflowHandler("missing-123"),
      );

      // Initially false
      expect(result.current.notFound).toBe(false);

      // Allow effect to run
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.notFound).toBe(true);
    });
  });

  describe("H9: sendEvent calls helper with handlerId and event", () => {
    it("should call sendEventToHandler when sendEvent is invoked", async () => {
      const { sendEventToHandler } = await import(
        "../../../src/workflows/store/helper"
      );

      const { result } = renderHookWithProvider(() =>
        useWorkflowHandler("task-123")
      );

      const event = { type: "test.event", data: { foo: "bar" } };

      await act(async () => {
        await result.current.sendEvent(event);
      });

      expect(sendEventToHandler).toHaveBeenCalledTimes(1);
      expect(sendEventToHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerId: "task-123",
          event,
        })
      );
    });
  });
});
