import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import { useWorkflowRun } from "../../../src/workflows/hooks/use-workflow-run";
import { renderHookWithProvider } from "../../test-utils";
import type { WorkflowHandlerSummary } from "../../../src/workflows/types";

// Mock the helper functions
vi.mock("../../../src/workflows/store/helper", () => ({
  createHandler: vi.fn(),
  fetchHandlerEvents: vi.fn().mockResolvedValue([]),
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

describe("useWorkflowRun", () => {
  const mockHandler: WorkflowHandlerSummary = {
    handler_id: "test-task-1",
    status: "running",
    workflowName: "test-workflow",
  };

  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("H1: Success creates and writes to store", () => {
    it("should have isCreating true then false, and return created task", async () => {
      // Mock successful API response
      const { createHandler } = await import(
        "../../../src/workflows/store/helper"
      );
      vi.mocked(createHandler).mockResolvedValue(mockHandler);

      const { result } = renderHookWithProvider(() => useWorkflowRun());

      // Initial state
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBe(null);

      // Start creation
      let createPromise: Promise<WorkflowHandlerSummary>;
      act(() => {
        createPromise = result.current.runWorkflow(
          "test-workflow",
          "test input"
        );
      });

      // Should be creating
      expect(result.current.isCreating).toBe(true);

      // Wait for completion and get result
      let createdTask: WorkflowHandlerSummary;
      await act(async () => {
        createdTask = await createPromise!;
      });

      // Should be done creating
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBe(null);

      // Verify the created task is returned correctly
      expect(createdTask!.handler_id).toBe(mockHandler.handler_id);

      // Verify the API was called correctly
      expect(createHandler).toHaveBeenCalledWith({
        client: expect.any(Object),
        workflowName: "test-workflow",
        eventData: "test input",
      });
    });
  });

  describe("H2: Backend error returns error and does not write store", () => {
    it("should capture error and set error state", async () => {
      // Mock API error
      const { createHandler } = await import(
        "../../../src/workflows/store/helper"
      );
      const testError = new Error("API Error");
      vi.mocked(createHandler).mockRejectedValue(testError);

      const { result } = renderHookWithProvider(() => useWorkflowRun());

      // Initial state
      expect(result.current.error).toBe(null);
      expect(result.current.isCreating).toBe(false);

      // Start creation that will fail
      let createPromise: Promise<WorkflowHandlerSummary>;
      act(() => {
        createPromise = result.current.runWorkflow(
          "test-workflow",
          "test input"
        );
      });

      // Should be creating
      expect(result.current.isCreating).toBe(true);

      // Wait for error
      await act(async () => {
        try {
          await createPromise!;
        } catch {
          // Expected to throw
        }
      });

      // Should be done creating and have error
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBe(testError);

      // Verify the API was called
      expect(createHandler).toHaveBeenCalledWith({
        client: expect.any(Object),
        workflowName: "test-workflow",
        eventData: "test input",
      });
    });
  });
});
