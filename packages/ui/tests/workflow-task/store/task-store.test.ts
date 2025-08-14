/**
 * Test cases for task store functionality
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createTaskStore } from "../../../src/workflow-task/store/task-store";
import {
  createTask as createTaskAPI,
  fetchTaskEvents,
  getRunningTasks,
} from "../../../src/workflow-task/store/helper";
import { workflowStreamingManager } from "../../../src/lib/shared-streaming";
import type {
  WorkflowTaskSummary,
  WorkflowEvent,
  TaskDefinition,
} from "../../../src/workflow-task/types";

// Mock the helper functions
vi.mock("../../../src/workflow-task/store/helper");
vi.mock("../../../src/lib/shared-streaming");

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
  const mockWorkflowTask: TaskDefinition = {
    task_id: "task-123",
    session_id: "session-456",
    service_id: "workflow-test",
    input: "test input",
  };

  const mockTaskSummary: WorkflowTaskSummary = {
    task_id: "task-123",
    session_id: "session-456",
    service_id: "workflow-test",
    input: "test input",
    deployment: "test-deployment",
    status: "running",
  };

  const mockEvent: WorkflowEvent = {
    type: "progress",
    data: "test event data",
  };

  // Create mock client
  const mockClient = {
    getConfig: () => ({ baseUrl: "http://localhost:8000" }),
  } as any;
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
    (createTaskAPI as any).mockResolvedValue(mockWorkflowTask);
    (fetchTaskEvents as any).mockResolvedValue([]);
    (getRunningTasks as any).mockResolvedValue([]);
    (workflowStreamingManager.isStreamActive as any).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create task and add to store", async () => {
      const result = await testStore
        .getState()
        .createTask("test-deployment", "test input");

      expect(result.task_id).toBe("task-123");
      expect(result.deployment).toBe("test-deployment");
      expect(result.status).toBe("running");
      expect(testStore.getState().tasks["task-123"]).toBeDefined();
      expect(testStore.getState().events["task-123"]).toEqual([]);
    });

    it("should call createTaskAPI with correct parameters", async () => {
      await testStore
        .getState()
        .createTask("test-deployment", "test input", "workflow-id");

      expect(createTaskAPI).toHaveBeenCalledWith({
        client: mockClient,
        deploymentName: "test-deployment",
        eventData: "test input",
        workflow: "workflow-id",
      });
    });

    it("should automatically call fetchTaskEvents for subscription", async () => {
      await testStore.getState().createTask("test-deployment", "test input");

      // Should call subscribe which internally calls fetchTaskEvents
      expect(fetchTaskEvents).toHaveBeenCalled();
    });
  });

  describe("clearCompleted", () => {
    it("should remove completed and error tasks", () => {
      const completedTask: WorkflowTaskSummary = {
        ...mockTaskSummary,
        task_id: "completed",
        status: "complete",
      };
      const errorTask: WorkflowTaskSummary = {
        ...mockTaskSummary,
        task_id: "error",
        status: "error",
      };
      const runningTask: WorkflowTaskSummary = {
        ...mockTaskSummary,
        task_id: "running",
        status: "running",
      };

      testStore.setState({
        tasks: {
          completed: completedTask,
          error: errorTask,
          running: runningTask,
        },
        events: {},
      });

      testStore.getState().clearCompleted();

      expect(testStore.getState().tasks).toEqual({
        running: runningTask,
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
      testStore.getState().subscribe("nonexistent", "test-deployment");

      expect(fetchTaskEvents).not.toHaveBeenCalled();
    });

    it("should subscribe to existing task", () => {
      testStore.setState({
        tasks: { "task-123": mockTaskSummary },
        events: {},
      });

      testStore.getState().subscribe("task-123", "test-deployment");

      expect(fetchTaskEvents).toHaveBeenCalled();
    });
  });

  describe("unsubscribe", () => {
    it("should call workflowStreamingManager.closeStream", () => {
      testStore.setState({
        tasks: { "task-123": mockTaskSummary },
        events: {},
      });

      testStore.getState().unsubscribe("task-123");

      expect(workflowStreamingManager.closeStream).toHaveBeenCalledWith(
        "task:task-123:test-deployment"
      );
    });
  });

  describe("isSubscribed", () => {
    it("should return streaming manager status for existing task", () => {
      testStore.setState({
        tasks: { "task-123": mockTaskSummary },
        events: {},
      });

      (workflowStreamingManager.isStreamActive as any).mockReturnValue(true);

      const result = testStore.getState().isSubscribed("task-123");

      expect(result).toBe(true);
      expect(workflowStreamingManager.isStreamActive).toHaveBeenCalledWith(
        "task:task-123:test-deployment"
      );
    });

    it("should return false for non-existent task", () => {
      const result = testStore.getState().isSubscribed("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("sync", () => {
    const mockServerTasks: WorkflowTaskSummary[] = [
      {
        task_id: "server-task-1",
        session_id: "session-1",
        service_id: "service-1",
        input: "server input 1",
        deployment: "test-deployment",
        status: "running",
      },
      {
        task_id: "server-task-2",
        session_id: "session-2",
        service_id: "service-2",
        input: "server input 2",
        deployment: "test-deployment",
        status: "running",
      },
    ];

    it("should fetch and sync running tasks from server", async () => {
      (getRunningTasks as any).mockResolvedValue(mockServerTasks);

      await testStore.getState().sync("test-deployment");

      expect(getRunningTasks).toHaveBeenCalledWith({
        client: mockClient,
        deploymentName: "test-deployment",
      });

      // Check if tasks were added to store
      const state = testStore.getState();
      expect(state.tasks["server-task-1"]).toEqual(mockServerTasks[0]);
      expect(state.tasks["server-task-2"]).toEqual(mockServerTasks[1]);
    });

    it("should auto-subscribe to synced running tasks", async () => {
      (getRunningTasks as any).mockResolvedValue(mockServerTasks);
      (workflowStreamingManager.isStreamActive as any).mockReturnValue(false);

      await testStore.getState().sync("test-deployment");

      // Should call fetchTaskEvents for each task
      expect(fetchTaskEvents).toHaveBeenCalledTimes(2);

      // Check if subscription calls were made correctly
      expect(fetchTaskEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockClient,
          deploymentName: "test-deployment",
          task: expect.objectContaining({
            task_id: "server-task-1",
          }),
        }),
        expect.any(Object)
      );
    });

    it("should not subscribe to already subscribed tasks", async () => {
      (getRunningTasks as any).mockResolvedValue(mockServerTasks);
      (workflowStreamingManager.isStreamActive as any).mockReturnValue(true);

      await testStore.getState().sync("test-deployment");

      // Should not call fetchTaskEvents since tasks are already subscribed
      expect(fetchTaskEvents).not.toHaveBeenCalled();
    });

    it("should handle sync errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (getRunningTasks as any).mockRejectedValue(new Error("Server error"));

      // Should not throw
      await expect(
        testStore.getState().sync("test-deployment")
      ).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to sync with server:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should replace existing tasks with server tasks", async () => {
      // First add some local tasks
      const localTask: WorkflowTaskSummary = {
        ...mockTaskSummary,
        task_id: "local-task",
        status: "running",
      };

      testStore.setState({
        tasks: { "local-task": localTask },
        events: {},
      });

      // Mock server returning different tasks
      (getRunningTasks as any).mockResolvedValue(mockServerTasks);

      await testStore.getState().sync("test-deployment");

      const state = testStore.getState();

      // Local task should be replaced by server tasks
      expect(state.tasks["local-task"]).toBeUndefined();
      expect(state.tasks["server-task-1"]).toBeDefined();
      expect(state.tasks["server-task-2"]).toBeDefined();
    });
  });
});
