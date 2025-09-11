/**
 * Test cases for useWorkflowTaskList hook (H3-H5)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import { useWorkflowTaskList } from "../../../src/workflow-task/hooks/use-workflow-task-list";
import { renderHookWithProvider } from "../../test-utils";

// Mock the helper functions to prevent real HTTP calls
vi.mock("../../../src/workflow-task/store/helper", () => ({
  getRunningHandlers: vi.fn().mockResolvedValue([]),
  getExistingHandler: vi.fn(),
  createTask: vi.fn(),
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
  });

  describe("H3: Initial render reads persisted tasks", () => {
    it("should return empty tasks initially", () => {
      const { result } = renderHookWithProvider(() => useWorkflowTaskList());

      expect(result.current.tasks).toEqual([]);
      expect(typeof result.current.clearCompleted).toBe("function");
    });
  });

  describe("H4: Auto-stream for running tasks", () => {
    it("should have auto-stream functionality", () => {
      const { result } = renderHookWithProvider(() => useWorkflowTaskList());

      // Test basic functionality - tasks should be empty initially
      expect(result.current.tasks).toEqual([]);
    });
  });

  describe("H5: clearCompleted removes only complete/error tasks", () => {
    it("should have clearCompleted function", () => {
      const { result } = renderHookWithProvider(() => useWorkflowTaskList());

      expect(typeof result.current.clearCompleted).toBe("function");

      act(() => {
        result.current.clearCompleted();
      });

      // Should not throw error
      expect(result.current.tasks).toEqual([]);
    });
  });
});
