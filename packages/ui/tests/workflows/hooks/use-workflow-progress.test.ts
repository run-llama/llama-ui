import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWorkflowProgress } from "../../../src/workflows/hooks/use-workflow-progress";
import { renderHookWithProvider } from "../../test-utils";

// Mock the helper functions to prevent real HTTP calls
vi.mock("../../../src/workflows/store/helper", () => ({
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

describe("useWorkflowProgress", () => {
  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("H9: Basic functionality", () => {
    it("should start with default values", () => {
      const { result } = renderHookWithProvider(() => useWorkflowProgress());

      expect(result.current.current).toBe(0);
      expect(result.current.total).toBe(0);
      expect(result.current.status).toBe("idle");
    });

    it("should have progress properties", () => {
      const { result } = renderHookWithProvider(() => useWorkflowProgress());

      expect(typeof result.current.current).toBe("number");
      expect(typeof result.current.total).toBe("number");
      expect(typeof result.current.status).toBe("string");
    });

    it("should be accessible from ApiProvider context", () => {
      const { result } = renderHookWithProvider(() => useWorkflowProgress());

      // Should not throw an error when called within ApiProvider
      expect(() => {
        const { current, total, status } = result.current;
        expect(current).toBe(0);
        expect(total).toBe(0);
        expect(status).toBe("idle");
      }).not.toThrow();
    });
  });

  describe("H9: Hook behavior and calculations", () => {
    it("should handle empty task store efficiently", () => {
      const { result } = renderHookWithProvider(() => useWorkflowProgress());

      expect(result.current.current).toBe(0);
      expect(result.current.total).toBe(0);
      expect(result.current.status).toBe("idle");
    });

    it("should memoize results correctly", () => {
      const { result, rerender } = renderHookWithProvider(() =>
        useWorkflowProgress()
      );

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // Results should be the same object reference when tasks haven't changed
      expect(firstResult).toBe(secondResult);
    });

    it("should return correct structure and types", () => {
      const { result } = renderHookWithProvider(() => useWorkflowProgress());

      // Verify structure
      expect(result.current).toHaveProperty("current");
      expect(result.current).toHaveProperty("total");
      expect(result.current).toHaveProperty("status");

      // Verify types
      expect(typeof result.current.current).toBe("number");
      expect(typeof result.current.total).toBe("number");
      expect(typeof result.current.status).toBe("string");

      // Verify status is valid
      expect(["idle", "running", "complete", "error"]).toContain(
        result.current.status
      );
    });

    it("should handle the useMemo dependency correctly", () => {
      // Test that the hook implementation uses useMemo correctly
      const { result } = renderHookWithProvider(() => {
        const progress = useWorkflowProgress();
        // Call multiple times to test memoization
        const progress2 = useWorkflowProgress();
        return { progress, progress2 };
      });

      // Both calls should return equal objects (content-wise)
      expect(result.current.progress).toStrictEqual(result.current.progress2);

      // Verify the structure is consistent
      expect(result.current.progress.current).toBe(
        result.current.progress2.current
      );
      expect(result.current.progress.total).toBe(
        result.current.progress2.total
      );
      expect(result.current.progress.status).toBe(
        result.current.progress2.status
      );
    });
  });
});
