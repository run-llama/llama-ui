import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHandlerStore } from "../../../src/workflows/store/handler-store";
import {
  createClient,
  createConfig,
  type Client,
  getHandlers,
  postWorkflowsByNameRunNowait,
} from "@llamaindex/workflows-client";
import type { Handler as RawHandler } from "@llamaindex/workflows-client";
import { Handler } from "../../../src/workflows/store/handler";

// Mock the workflows-client API functions
vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual("@llamaindex/workflows-client");
  return {
    ...actual,
    getHandlers: vi.fn(),
    postWorkflowsByNameRunNowait: vi.fn(),
  };
});

// Mock the Handler class
vi.mock("../../../src/workflows/store/handler", () => ({
  Handler: vi.fn().mockImplementation((rawHandler: RawHandler) => ({
    handlerId: rawHandler.handler_id,
    workflowName: rawHandler.workflow_name,
    status: rawHandler.status,
    startedAt: new Date(rawHandler.started_at),
    updatedAt: rawHandler.updated_at ? new Date(rawHandler.updated_at) : null,
    completedAt: rawHandler.completed_at
      ? new Date(rawHandler.completed_at)
      : null,
    error: rawHandler.error,
    subscribeToEvents: vi.fn(),
    sendEvent: vi.fn(),
    disconnect: vi.fn(),
    unsubscribe: vi.fn(),
    cancel: vi.fn(),
  })),
}));

describe("Handler Store Tests", () => {
  const mockRawHandler: RawHandler = {
    handler_id: "handler-123",
    workflow_name: "test-workflow",
    status: "running",
    started_at: "2024-01-01T00:00:00Z",
    updated_at: null,
    completed_at: null,
    error: null,
  };

  // Real client instance (APIs are mocked)
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
    });
  });

  describe("createHandler", () => {
    it("should create handler and add to store", async () => {
      vi.mocked(postWorkflowsByNameRunNowait).mockResolvedValue({
        data: mockRawHandler,
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      const result = await testStore
        .getState()
        .createHandler("test-workflow", { input: "test" });

      expect(result.handlerId).toBe("handler-123");
      expect(result.workflowName).toBe("test-workflow");
      expect(result.status).toBe("running");
      expect(testStore.getState().handlers["handler-123"]).toBeDefined();
    });

    it("should call API with correct parameters", async () => {
      vi.mocked(postWorkflowsByNameRunNowait).mockResolvedValue({
        data: mockRawHandler,
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      await testStore.getState().createHandler("test-workflow", { key: "value" });

      expect(postWorkflowsByNameRunNowait).toHaveBeenCalledWith({
        client: mockClient,
        path: { name: "test-workflow" },
        body: {
          start_event: { key: "value" },
        },
      });
    });

    it("should throw error if handler creation fails", async () => {
      vi.mocked(postWorkflowsByNameRunNowait).mockResolvedValue({
        data: undefined,
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      await expect(
        testStore.getState().createHandler("test-workflow", { input: "test" })
      ).rejects.toThrow("Handler creation failed");
    });

    it("should create Handler instance with client", async () => {
      vi.mocked(postWorkflowsByNameRunNowait).mockResolvedValue({
        data: mockRawHandler,
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      await testStore.getState().createHandler("test-workflow", { input: "test" });

      expect(Handler).toHaveBeenCalledWith(mockRawHandler, mockClient);
    });
  });

  describe("fetchRunningHandlers", () => {
    it("should fetch and return only running handlers", async () => {
      const mockHandlers: RawHandler[] = [
        {
          handler_id: "handler-1",
          workflow_name: "workflow-1",
          status: "running",
          started_at: "2024-01-01T00:00:00Z",
          updated_at: null,
          completed_at: null,
          error: null,
        },
        {
          handler_id: "handler-2",
          workflow_name: "workflow-2",
          status: "completed",
          started_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:01:00Z",
          completed_at: "2024-01-01T00:01:00Z",
          error: null,
        },
        {
          handler_id: "handler-3",
          workflow_name: "workflow-3",
          status: "running",
          started_at: "2024-01-01T00:00:00Z",
          updated_at: null,
          completed_at: null,
          error: null,
        },
      ];

      vi.mocked(getHandlers).mockResolvedValue({
        data: { handlers: mockHandlers },
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      const result = await testStore.getState().fetchRunningHandlers();

      expect(getHandlers).toHaveBeenCalledWith({ client: mockClient });
      expect(result).toHaveLength(2);
      expect(result[0].handlerId).toBe("handler-1");
      expect(result[1].handlerId).toBe("handler-3");
    });

    it("should handle empty handlers list", async () => {
      vi.mocked(getHandlers).mockResolvedValue({
        data: { handlers: [] },
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      const result = await testStore.getState().fetchRunningHandlers();

      expect(result).toHaveLength(0);
    });

    it("should handle undefined data", async () => {
      vi.mocked(getHandlers).mockResolvedValue({
        data: undefined,
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      const result = await testStore.getState().fetchRunningHandlers();

      expect(result).toHaveLength(0);
    });

    it("should create Handler instances for each running handler", async () => {
      const runningHandler: RawHandler = {
        handler_id: "handler-1",
        workflow_name: "workflow-1",
        status: "running",
        started_at: "2024-01-01T00:00:00Z",
        updated_at: null,
        completed_at: null,
        error: null,
      };

      vi.mocked(getHandlers).mockResolvedValue({
        data: { handlers: [runningHandler] },
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      await testStore.getState().fetchRunningHandlers();

      expect(Handler).toHaveBeenCalledWith(runningHandler, mockClient);
    });
  });

  describe("handlers state", () => {
    it("should store created handlers by handler_id", async () => {
      vi.mocked(postWorkflowsByNameRunNowait).mockResolvedValue({
        data: mockRawHandler,
        error: undefined,
        request: {} as Request,
        response: {} as Response,
      });

      await testStore.getState().createHandler("test-workflow", { input: "test" });

      const handlers = testStore.getState().handlers;
      expect(Object.keys(handlers)).toHaveLength(1);
      expect(handlers["handler-123"]).toBeDefined();
      expect(handlers["handler-123"].handlerId).toBe("handler-123");
    });

    it("should handle multiple handlers", async () => {
      const handler1: RawHandler = {
        ...mockRawHandler,
        handler_id: "handler-1",
      };
      const handler2: RawHandler = {
        ...mockRawHandler,
        handler_id: "handler-2",
      };

      vi.mocked(postWorkflowsByNameRunNowait)
        .mockResolvedValueOnce({
          data: handler1,
          error: undefined,
          request: {} as Request,
          response: {} as Response,
        })
        .mockResolvedValueOnce({
          data: handler2,
          error: undefined,
          request: {} as Request,
          response: {} as Response,
        });

      await testStore.getState().createHandler("workflow-1", { input: "test1" });
      await testStore.getState().createHandler("workflow-2", { input: "test2" });

      const handlers = testStore.getState().handlers;
      expect(Object.keys(handlers)).toHaveLength(2);
      expect(handlers["handler-1"]).toBeDefined();
      expect(handlers["handler-2"]).toBeDefined();
    });
  });
});
