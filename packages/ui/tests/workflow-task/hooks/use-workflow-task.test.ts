/**
 * Test cases for useWorkflowTask hook (H6-H8)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import { useWorkflowTask } from "../../../src/workflow-task/hooks/use-workflow-task";
import { renderHookWithProvider } from "../../test-utils";
import { useTaskStore } from "../../../src/workflow-task/hooks/use-task-store";

// Mock helper and streaming to control task creation and completion without real network/streams
vi.mock("../../../src/workflow-task/store/helper", () => {
  return {
    // createTask returns a deterministic task shape consumed by the store
    createTask: vi.fn(async (_args: any) => {
      return {
        task_id: "task-switch-1",
        session_id: "session-1",
        service_id: "service-1",
        input: "input",
      };
    }),
    // sync helper used by store.sync
    getRunningTasks: vi.fn(async (_args: any) => {
      return [];
    }),
    // fetchTaskEvents immediately invokes onFinish to mark task complete in store
    fetchTaskEvents: vi.fn(async (_params: any, callback?: any) => {
      // simulate async completion
      setTimeout(() => {
        callback?.onFinish?.([]);
      }, 0);
      return [];
    }),
  };
});
vi.mock("../../../src/lib/shared-streaming", () => {
  const manager = {
    subscribe: vi.fn(() => ({ promise: Promise.resolve([]), unsubscribe: vi.fn() })),
    isStreamActive: vi.fn(() => false),
    closeStream: vi.fn(),
    closeAllStreams: vi.fn(),
    getSubscriberCount: vi.fn(() => 0),
    getStreamEvents: vi.fn(() => []),
  };
  return { workflowStreamingManager: manager };
});

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
      const { result } = renderHookWithProvider(
        () => useWorkflowTask({ taskId: "task-123" }),
        { deployment: 'dep-1' }
      );

      // The hook should work without errors
      expect(result.current.task).toBe(null); // Initially no task
      expect(result.current.events).toHaveLength(0);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("H7: clearEvents empties events array", () => {
    it("should have clearEvents function", () => {
      const { result } = renderHookWithProvider(
        () => useWorkflowTask({ taskId: "task-123" }),
        { deployment: 'dep-1' }
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
        useWorkflowTask({ taskId: "task-123" })
      );

      expect(typeof result.current.stopStreaming).toBe("function");

      act(() => {
        result.current.stopStreaming();
      });

      // Should not throw error
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("H9: switching between having taskId and not having taskId", () => {
    it("should update task, events, and isStreaming appropriately when toggling taskId", async () => {
      // Prepare store and create a running task
      const storeHook = renderHookWithProvider(() => useTaskStore());
      let createdTaskId = "";
      await act(async () => {
        const task = await storeHook.result.current.createTask(
          "dep-1",
          "input"
        );
        createdTaskId = task.task_id;
      });

      // Start with a taskId
      let options: Parameters<typeof useWorkflowTask>[0] = {
        taskId: createdTaskId,
        autoStream: false,
      };
      const { result, rerender } = renderHookWithProvider(
        () => useWorkflowTask(options),
        { deployment: 'dep-1' }
      );

      expect(result.current.task?.task_id).toBe(createdTaskId);
      expect(result.current.events).toEqual([]);
      expect(result.current.isStreaming).toBe(false);

      // Switch to no taskId
      await act(async () => {
        options = { taskId: undefined, autoStream: false };
        rerender();
      });
      expect(result.current.task).toBe(null);
      expect(result.current.events).toEqual([]);
      expect(result.current.isStreaming).toBe(false);

      // Switch back to taskId
      await act(async () => {
        options = { taskId: createdTaskId, autoStream: false };
        rerender();
      });
      expect(result.current.task?.task_id).toBe(createdTaskId);
      expect(result.current.events).toEqual([]);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("H10: completion callback is invoked on task completion", () => {
    it("should call onTaskResult when task transitions to complete", async () => {
      // Mount hook first with the expected taskId, then create the task and complete it
      const onTaskResult = vi.fn();
      const expectedTaskId = "task-switch-1"; // from mocked createTask

      const hook = renderHookWithProvider(
        () =>
          useWorkflowTask({
            taskId: expectedTaskId,
            onTaskResult,
            autoStream: true,
          }),
        { deployment: 'dep-2' }
      );

      // Override fetchTaskEvents for this flow to complete after mount
      const helper: any = await import("../../../src/workflow-task/store/helper");
      helper.fetchTaskEvents.mockImplementationOnce(async (_params: any, callback?: any) => {
        setTimeout(() => {
          callback?.onFinish?.([]);
        }, 0);
        return [];
      });

      // Now create the task which auto-subscribes and will complete shortly
      const storeHook = renderHookWithProvider(() => useTaskStore());
      await act(async () => {
        await storeHook.result.current.createTask("dep-2", "input");
      });

      // Wait for completion and re-render to flush effects
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        hook.rerender();
      });

      expect(onTaskResult).toHaveBeenCalledTimes(1);
      expect(onTaskResult.mock.calls[0][0].task).toMatchObject({
        task_id: expectedTaskId,
        status: "complete",
      });
    });
  });
});
