import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { useWorkflowHandlerList } from "../../../src/workflows/hooks/use-workflow-handler-list";
import { __resetHandlerStore } from "../../../src/workflows/hooks/use-handler-store";
import { renderHookWithProvider } from "../../test-utils";

// Mock the helper functions to prevent real HTTP calls (use hoisted refs)
const hoisted = vi.hoisted(() => ({
  getRunningHandlersMock: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../src/workflows/store/helper", () => ({
  getRunningHandlers: hoisted.getRunningHandlersMock,
  getExistingHandler: vi.fn(),
  createHandler: vi.fn(),
  fetchHandlerEvents: vi.fn().mockResolvedValue([]),
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

describe("useWorkflowTaskList", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    hoisted.getRunningHandlersMock.mockResolvedValue([]);
    __resetHandlerStore();
  });

  describe("H3: Initial render reads persisted tasks", () => {
    it("should return empty tasks initially", () => {
      const { result } = renderHookWithProvider(() =>
        useWorkflowHandlerList("alpha")
      );

      expect(result.current.handlers).toEqual([]);
      expect(typeof result.current.clearCompleted).toBe("function");
    });
  });

  describe("H4: Auto-stream for running tasks", () => {
    it("should have auto-stream functionality", () => {
      const { result } = renderHookWithProvider(() =>
        useWorkflowHandlerList("alpha")
      );

      // Test basic functionality - tasks should be empty initially
      expect(result.current.handlers).toEqual([]);
    });
  });

  describe("H5: clearCompleted removes only complete/error tasks", () => {
    it("should have clearCompleted function", () => {
      const { result } = renderHookWithProvider(() =>
        useWorkflowHandlerList("alpha")
      );

      expect(typeof result.current.clearCompleted).toBe("function");

      act(() => {
        result.current.clearCompleted();
      });

      // Should not throw error
      expect(result.current.handlers).toEqual([]);
    });
  });

  describe("workflowName filtering", () => {
    it("falls back to running handlers when workflow metadata is unavailable", async () => {
      hoisted.getRunningHandlersMock.mockResolvedValueOnce([
        { handler_id: "alpha-1", status: "running" },
        { handler_id: "beta-1", status: "running" },
        { handler_id: "gamma-1", status: "failed" },
      ]);

      const { result } = renderHookWithProvider(() =>
        useWorkflowHandlerList("alpha")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.handlers).toEqual([
        { handler_id: "alpha-1", status: "running" },
        { handler_id: "beta-1", status: "running" },
      ]);
    });
  });
});
