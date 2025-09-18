/**
 * Test cases for task store functionality
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createTaskStore } from "../../../src/workflow-task/store/task-store";
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import {
  createTask as createTaskAPI,
  fetchHandlerEvents,
  getRunningHandlers,
} from "../../../src/workflow-task/store/helper";
import { workflowStreamingManager } from "../../../src/lib/shared-streaming";
import {
  createClient,
  createConfig,
  type Client,
} from "@llamaindex/workflows-client";
import type {
  WorkflowHandlerSummary,
  WorkflowEvent,
} from "../../../src/workflow-task/types";

// Mock the helper functions
vi.mock("../../../src/workflow-task/store/helper");
vi.mock("../../../src/lib/shared-streaming", () => ({
  workflowStreamingManager: {
    subscribe: vi.fn(),
    isStreamActive: vi.fn(),
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

describe("Complete Task Store Tests", () => {
  const mockWorkflowName = "test-workflow";
  const mockTaskSummary: WorkflowHandlerSummary = {
    handler_id: "task-123",
    status: "running",
    workflowName: mockWorkflowName,
  };

  const mockEvent: WorkflowEvent = {
    type: "progress",
    data: "test event data",
  };

  // Real client instance (no network since APIs are mocked in tests)
  const mockClient: Client = createClient(
    createConfig({
      baseUrl: "http://localhost:8000" as unknown as `${string}://${string}`,
    })
  );
  let testStore: ReturnType<typeof createTaskStore>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh store for each test
    testStore = createTaskStore(mockClient);
    testStore.setState({
      tasks: {},
      events: {},
    });

    // Clear localStorage mock
    localStorageMock.clear();

    // Setup default mock implementations
    const mockedCreateTaskAPI = vi.mocked(createTaskAPI);
    const mockedFetchHandlerEvents = vi.mocked(fetchHandlerEvents);
    const mockedGetRunningHandlers = vi.mocked(getRunningHandlers);
    const mockedStreaming = vi.mocked(workflowStreamingManager);

    mockedCreateTaskAPI.mockResolvedValue(mockTaskSummary);
    mockedFetchHandlerEvents.mockResolvedValue([]);
    mockedGetRunningHandlers.mockResolvedValue([]);
    mockedStreaming.isStreamActive.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create task and add to store", async () => {
      const result = await testStore
        .getState()
        .createTask(mockWorkflowName, "test input");

      expect(result.handler_id).toBe("task-123");
      expect(result.status).toBe("running");
      expect(testStore.getState().tasks["task-123"]).toBeDefined();
      expect(testStore.getState().events["task-123"]).toEqual([]);
      expect(testStore.getState().tasks["task-123"].workflowName).toBe(
        mockWorkflowName
      );
    });

    it("should call createTaskAPI with correct parameters", async () => {
      await testStore.getState().createTask(mockWorkflowName, "test input");

      expect(createTaskAPI).toHaveBeenCalledWith({
        client: mockClient,
        workflowName: mockWorkflowName,
        eventData: "test input",
      });
    });

    it("should automatically call fetchTaskEvents for subscription", async () => {
      await testStore.getState().createTask(mockWorkflowName, "test input");

      // Should call subscribe which internally calls fetchTaskEvents
      expect(vi.mocked(fetchHandlerEvents)).toHaveBeenCalled();
    });
  });

  describe("clearCompleted", () => {
    it("should remove completed and error tasks", () => {
      const completedTask: WorkflowHandlerSummary = {
        ...mockTaskSummary,
        handler_id: "completed",
        status: "complete",
        workflowName: mockWorkflowName,
      };
      const errorTask: WorkflowHandlerSummary = {
        ...mockTaskSummary,
        handler_id: "error",
        status: "failed",
        workflowName: mockWorkflowName,
      };
      const runningTask: WorkflowHandlerSummary = {
        ...mockTaskSummary,
        handler_id: "running",
        status: "running",
        workflowName: mockWorkflowName,
      };

      testStore.setState({
        tasks: {
          completed: completedTask,
          error: errorTask,
          running: runningTask,
        },
        events: {},
      });

      testStore.getState().clearCompleted(mockWorkflowName);

      expect(testStore.getState().tasks).toEqual({
        running: runningTask,
      });
    });

    it("should only clear completed tasks for specified workflow", () => {
      const otherWorkflowTask: WorkflowHandlerSummary = {
        ...mockTaskSummary,
        handler_id: "other",
        status: "complete",
        workflowName: "other-workflow",
      };

      testStore.setState({
        tasks: {
          completed: {
            ...mockTaskSummary,
            handler_id: "completed",
            status: "complete",
            workflowName: mockWorkflowName,
          },
          other: otherWorkflowTask,
        },
        events: {},
      });

      testStore.getState().clearCompleted(mockWorkflowName);

      expect(testStore.getState().tasks).toEqual({
        other: otherWorkflowTask,
      });
    });
  });

  describe("clearEvents", () => {
    it("should clear events for specific task", () => {
      testStore.setState({
        tasks: {},
        events: {
          "task-123": [mockEvent],
          "task-456": [mockEvent],
        },
      });

      testStore.getState().clearEvents("task-123");

      expect(testStore.getState().events["task-123"]).toEqual([]);
      expect(testStore.getState().events["task-456"]).toEqual([mockEvent]);
    });
  });

  describe("subscribe", () => {
    it("should not subscribe if task does not exist", () => {
      testStore.getState().subscribe("nonexistent");

      expect(vi.mocked(fetchHandlerEvents)).not.toHaveBeenCalled();
    });

    it("should subscribe to existing task", () => {
      testStore.setState({
        tasks: { "task-123": mockTaskSummary },
        events: {},
      });

      const subscribe = testStore.getState().subscribe;
      subscribe.call(testStore.getState(), "task-123");

      expect(vi.mocked(fetchHandlerEvents)).toHaveBeenCalled();
    });
  });

  describe("unsubscribe", () => {
    it("should call workflowStreamingManager.closeStream", () => {
      testStore.setState({
        tasks: { "task-123": mockTaskSummary },
        events: {},
      });

      const closeStream = workflowStreamingManager.closeStream;
      testStore.getState().unsubscribe("task-123");

      expect(closeStream).toHaveBeenCalledWith("handler:task-123");
    });
  });

  describe("isSubscribed", () => {
    it("should return streaming manager status for existing task", () => {
      testStore.setState({
        tasks: { "task-123": mockTaskSummary },
        events: {},
      });

      // access via variable to bind this: void
      const isActive = workflowStreamingManager.isStreamActive;
      vi.mocked(isActive).mockReturnValue(true);

      const result = testStore.getState().isSubscribed("task-123");

      expect(result).toBe(true);
      const isActiveMethod = workflowStreamingManager.isStreamActive;
      expect(isActiveMethod).toHaveBeenCalledWith("handler:task-123");
    });

    it("should return false for non-existent task", () => {
      const result = testStore.getState().isSubscribed("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("sync", () => {
    const mockServerTasks: WorkflowHandlerSummary[] = [
      {
        handler_id: "server-task-1",
        status: "running",
        workflowName: mockWorkflowName,
      },
      {
        handler_id: "server-task-2",
        status: "running",
        workflowName: mockWorkflowName,
      },
    ];

    it("should fetch and sync running tasks from server", async () => {
      (getRunningHandlers as any).mockResolvedValue(mockServerTasks);

      await testStore.getState().sync(mockWorkflowName);

      expect(getRunningHandlers).toHaveBeenCalledWith({
        client: mockClient,
        workflowName: mockWorkflowName,
      });

      // Check if tasks were added to store
      const state = testStore.getState();
      expect(state.tasks["server-task-1"]).toEqual(mockServerTasks[0]);
      expect(state.tasks["server-task-2"]).toEqual(mockServerTasks[1]);
    });

    it("should auto-subscribe to synced running tasks", async () => {
      (getRunningHandlers as any).mockResolvedValue(mockServerTasks);
      (workflowStreamingManager.isStreamActive as any).mockReturnValue(false);

      await testStore.getState().sync(mockWorkflowName);

      // Should call fetchTaskEvents for each task
      expect(fetchHandlerEvents).toHaveBeenCalledTimes(2);

      // Check if subscription calls were made correctly
      expect(fetchHandlerEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockClient,
          handlerId: "server-task-1",
        }),
        expect.any(Object)
      );
    });

    it("should not subscribe to already subscribed tasks", async () => {
      (getRunningHandlers as any).mockResolvedValue(mockServerTasks);
      (workflowStreamingManager.isStreamActive as any).mockReturnValue(true);

      await testStore.getState().sync(mockWorkflowName);

      // Should not call fetchTaskEvents since tasks are already subscribed
      expect(fetchHandlerEvents).not.toHaveBeenCalled();
    });

    it("should handle sync errors gracefully", async () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const consoleErrorSpy = vi
        // eslint-disable-next-line @typescript-eslint/unbound-method
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (getRunningHandlers as any).mockRejectedValue(new Error("Server error"));

      // Should not throw
      await expect(
        testStore.getState().sync(mockWorkflowName)
      ).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to sync with server:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should replace existing tasks with server tasks", async () => {
      // First add some local tasks
      const localTask: WorkflowHandlerSummary = {
        ...mockTaskSummary,
        handler_id: "local-task",
        status: "running",
        workflowName: mockWorkflowName,
      };

      testStore.setState({
        tasks: { "local-task": localTask },
        events: {},
      });

      // Mock server returning different tasks
      (getRunningHandlers as any).mockResolvedValue(mockServerTasks);

      await testStore.getState().sync(mockWorkflowName);

      const state = testStore.getState();

      // Local task should be replaced by server tasks
      expect(state.tasks["local-task"]).toBeUndefined();
      expect(state.tasks["server-task-1"]).toBeDefined();
      expect(state.tasks["server-task-2"]).toBeDefined();
    });

    it("should retain tasks from other workflows when syncing", async () => {
      const otherWorkflowTask: WorkflowHandlerSummary = {
        handler_id: "other-task",
        status: "running",
        workflowName: "other-workflow",
      };

      testStore.setState({
        tasks: { "other-task": otherWorkflowTask },
        events: {},
      });

      (getRunningHandlers as any).mockResolvedValue(mockServerTasks);

      await testStore.getState().sync(mockWorkflowName);

      expect(testStore.getState().tasks).toMatchObject({
        "other-task": otherWorkflowTask,
        "server-task-1": expect.objectContaining({
          workflowName: mockWorkflowName,
        }),
      });
    });
  });
});
