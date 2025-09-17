import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createHandlerStore } from "../../../src/workflows/store/handler-store";
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import {
  createHandler,
  fetchHandlerEvents,
  getRunningHandlers,
} from "../../../src/workflows/store/helper";
import { workflowStreamingManager } from "../../../src/lib/shared-streaming";
import {
  createClient,
  createConfig,
  type Client,
} from "@llamaindex/workflows-client";
import type {
  WorkflowHandlerSummary,
  WorkflowEvent,
} from "../../../src/workflows/types";

// Mock the helper functions
vi.mock("../../../src/workflows/store/helper");
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
  const mockTaskSummary: WorkflowHandlerSummary = {
    handler_id: "task-123",
    status: "running",
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
  let testStore: ReturnType<typeof createHandlerStore>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh store for each test
    testStore = createHandlerStore(mockClient);
    testStore.setState({
      handlers: {},
      events: {},
    });

    // Clear localStorage mock
    localStorageMock.clear();

    // Setup default mock implementations
    const mockedCreateHandler = vi.mocked(createHandler);
    const mockedFetchHandlerEvents = vi.mocked(fetchHandlerEvents);
    const mockedGetRunningHandlers = vi.mocked(getRunningHandlers);
    const mockedStreaming = vi.mocked(workflowStreamingManager);

    mockedCreateHandler.mockResolvedValue(mockTaskSummary);
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
        .createHandler("test-workflow", "test input");

      expect(result.handler_id).toBe("task-123");
      expect(result.status).toBe("running");
      expect(testStore.getState().handlers["task-123"]).toBeDefined();
      expect(testStore.getState().events["task-123"]).toEqual([]);
    });

    it("should call createTaskAPI with correct parameters", async () => {
      await testStore.getState().createHandler("test-workflow", "test input");

      expect(createHandler).toHaveBeenCalledWith({
        client: mockClient,
        workflowName: "test-workflow",
        eventData: "test input",
      });
    });

    it("should automatically call fetchTaskEvents for subscription", async () => {
      await testStore.getState().createHandler("test-workflow", "test input");

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
      };
      const errorTask: WorkflowHandlerSummary = {
        ...mockTaskSummary,
        handler_id: "error",
        status: "failed",
      };
      const runningTask: WorkflowHandlerSummary = {
        ...mockTaskSummary,
        handler_id: "running",
        status: "running",
      };

      testStore.setState({
        handlers: {
          completed: completedTask,
          error: errorTask,
          running: runningTask,
        },
        events: {},
      });

      testStore.getState().clearCompleted();

      expect(testStore.getState().handlers).toEqual({
        running: runningTask,
      });
    });
  });

  describe("clearEvents", () => {
    it("should clear events for specific task", () => {
      testStore.setState({
        handlers: {},
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
        handlers: { "task-123": mockTaskSummary },
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
        handlers: { "task-123": mockTaskSummary },
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
        handlers: { "task-123": mockTaskSummary },
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
      },
      {
        handler_id: "server-task-2",
        status: "running",
      },
    ];

    it("should fetch and sync running tasks from server", async () => {
      (getRunningHandlers as any).mockResolvedValue(mockServerTasks);

      await testStore.getState().sync();

      expect(getRunningHandlers).toHaveBeenCalledWith({
        client: mockClient,
      });

      // Check if tasks were added to store
      const state = testStore.getState();
      expect(state.handlers["server-task-1"]).toEqual(mockServerTasks[0]);
      expect(state.handlers["server-task-2"]).toEqual(mockServerTasks[1]);
    });

    it("should auto-subscribe to synced running tasks", async () => {
      (getRunningHandlers as any).mockResolvedValue(mockServerTasks);
      (workflowStreamingManager.isStreamActive as any).mockReturnValue(false);

      await testStore.getState().sync();

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

      await testStore.getState().sync();

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
      await expect(testStore.getState().sync()).resolves.toBeUndefined();

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
      };

      testStore.setState({
        handlers: { "local-task": localTask },
        events: {},
      });

      // Mock server returning different tasks
      (getRunningHandlers as any).mockResolvedValue(mockServerTasks);

      await testStore.getState().sync();

      const state = testStore.getState();

      // Local task should be replaced by server tasks
      expect(state.handlers["local-task"]).toBeUndefined();
      expect(state.handlers["server-task-1"]).toBeDefined();
      expect(state.handlers["server-task-2"]).toBeDefined();
    });
  });
});
