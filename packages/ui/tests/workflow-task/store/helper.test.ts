/**
 * Test cases for helper.ts functions
 * Testing API calls, event streaming, and utility functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getRunningTasks,
  getExistingTask,
  createTask,
  fetchTaskEvents,
  sendEventToTask,
} from '../../../src/workflow-task/store/helper';
import { workflowStreamingManager } from '../../../src/lib/shared-streaming';
import type { TaskParams, WorkflowEvent } from '../../../src/workflow-task/types';

// Mock dependencies
vi.mock('@llamaindex/llama-deploy');
vi.mock('../../../src/lib/shared-streaming');

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Helper Functions Tests', () => {
  const mockClient = {
    getConfig: vi.fn(() => ({ baseUrl: 'http://localhost:8000' })),
  } as unknown as any;

  const mockTask: TaskParams = {
    task_id: 'task-123',
    session_id: 'session-456',
    service_id: 'workflow-service',
    input: 'test input',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRunningTasks', () => {
    const mockGetTasksResponse = {
      data: [
        {
          task_id: 'task-1',
          session_id: 'session-1',
          service_id: 'service-1',
          input: 'input-1',
          // No status field - backend doesn't return it
        },
        {
          task_id: 'task-2',
          session_id: 'session-2',
          service_id: 'service-2',
          input: 'input-2',
          // No status field - backend doesn't return it
        },
        {
          task_id: 'task-3',
          session_id: 'session-3',
          service_id: 'service-3',
          input: 'input-3',
          // No status field - backend doesn't return it
        },
      ],
    };

    it('should fetch all tasks from server (all are running)', async () => {
      const { getTasksDeploymentsDeploymentNameTasksGet } = await import('@llamaindex/llama-deploy');
      vi.mocked(getTasksDeploymentsDeploymentNameTasksGet).mockResolvedValue(mockGetTasksResponse as any);

      const result = await getRunningTasks({
        client: mockClient,
        deploymentName: 'test-deployment',
      });

      expect(getTasksDeploymentsDeploymentNameTasksGet).toHaveBeenCalledWith({
        client: mockClient,
        path: { deployment_name: 'test-deployment' },
      });

      // All tasks from backend are running tasks
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        task_id: 'task-1',
        session_id: 'session-1',
        service_id: 'service-1',
        input: 'input-1',
        deployment: 'test-deployment',
        status: 'running',
      });
      expect(result[1]).toEqual({
        task_id: 'task-2',
        session_id: 'session-2',
        service_id: 'service-2',
        input: 'input-2',
        deployment: 'test-deployment',
        status: 'running',
      });
    });

    it('should return empty array when no tasks', async () => {
      const { getTasksDeploymentsDeploymentNameTasksGet } = await import('@llamaindex/llama-deploy');
      vi.mocked(getTasksDeploymentsDeploymentNameTasksGet).mockResolvedValue({
        data: [],
      } as any);

      const result = await getRunningTasks({
        client: mockClient,
        deploymentName: 'test-deployment',
      });

      expect(result).toHaveLength(0);
    });

    it('should handle missing fields with defaults', async () => {
      const { getTasksDeploymentsDeploymentNameTasksGet } = await import('@llamaindex/llama-deploy');
      vi.mocked(getTasksDeploymentsDeploymentNameTasksGet).mockResolvedValue({
        data: [
          {
            // Missing some fields
            task_id: 'task-1',
            // No other fields
          },
        ],
      } as any);

      const result = await getRunningTasks({
        client: mockClient,
        deploymentName: 'test-deployment',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        task_id: 'task-1',
        session_id: '',
        service_id: '',
        input: '',
        deployment: 'test-deployment',
        status: 'running',
      });
    });
  });

  describe('getExistingTask', () => {
    it('should successfully retrieve an existing task', async () => {
      const mockResponse = {
        data: [
          {
            task_id: 'task-123',
            session_id: 'session-456',
            service_id: 'workflow-service',
            input: 'test input',
          },
          {
            task_id: 'other-task',
            session_id: 'other-session',
            service_id: 'other-service',
            input: 'other input',
          },
        ],
      };

      const { getTasksDeploymentsDeploymentNameTasksGet } = await import('@llamaindex/llama-deploy');
      vi.mocked(getTasksDeploymentsDeploymentNameTasksGet).mockResolvedValue(mockResponse as any);

      const result = await getExistingTask({
        client: mockClient,
        deploymentName: 'test-deployment',
        taskId: 'task-123',
      });

      expect(result).toEqual({
        task_id: 'task-123',
        session_id: 'session-456',
        service_id: 'workflow-service',
        input: 'test input',
      });

      expect(getTasksDeploymentsDeploymentNameTasksGet).toHaveBeenCalledWith({
        client: mockClient,
        path: { deployment_name: 'test-deployment' },
      });
    });

    it('should throw error when task is not found', async () => {
      const mockResponse = {
        data: [
          {
            task_id: 'other-task',
            session_id: 'other-session',
            service_id: 'other-service',
            input: 'other input',
          },
        ],
      };

      const { getTasksDeploymentsDeploymentNameTasksGet } = await import('@llamaindex/llama-deploy');
      vi.mocked(getTasksDeploymentsDeploymentNameTasksGet).mockResolvedValue(mockResponse as any);

      await expect(
        getExistingTask({
          client: mockClient,
          deploymentName: 'test-deployment',
          taskId: 'non-existent-task',
        })
      ).rejects.toThrow('Task non-existent-task not found');
    });

  });

  describe('createTask', () => {
    it('should successfully create a new task', async () => {
      const mockResponse = {
        data: {
          task_id: 'new-task-123',
          session_id: 'new-session-456',
          service_id: 'workflow-service',
          input: '{"test":"data"}',
        },
      };

      const { createDeploymentTaskNowaitDeploymentsDeploymentNameTasksCreatePost } = await import('@llamaindex/llama-deploy');
      vi.mocked(createDeploymentTaskNowaitDeploymentsDeploymentNameTasksCreatePost).mockResolvedValue(mockResponse as any);

      const result = await createTask({
        client: mockClient,
        deploymentName: 'test-deployment',
        eventData: { test: 'data' },
        workflow: 'custom-workflow',
      });

      expect(result).toEqual({
        task_id: 'new-task-123',
        session_id: 'new-session-456',
        service_id: 'workflow-service',
        input: '{"test":"data"}',
      });

      expect(createDeploymentTaskNowaitDeploymentsDeploymentNameTasksCreatePost).toHaveBeenCalledWith({
        client: mockClient,
        path: { deployment_name: 'test-deployment' },
        body: {
          input: '{"test":"data"}',
          service_id: 'custom-workflow',
        },
      });
    });

    it('should create task without workflow parameter', async () => {
      const mockResponse = {
        data: {
          task_id: 'new-task-123',
          session_id: 'new-session-456',
          service_id: 'default-service',
          input: '{"test":"data"}',
        },
      };

      const { createDeploymentTaskNowaitDeploymentsDeploymentNameTasksCreatePost } = await import('@llamaindex/llama-deploy');
      vi.mocked(createDeploymentTaskNowaitDeploymentsDeploymentNameTasksCreatePost).mockResolvedValue(mockResponse as any);

      const result = await createTask({
        client: mockClient,
        deploymentName: 'test-deployment',
        eventData: { test: 'data' },
      });

      expect(result).toEqual({
        task_id: 'new-task-123',
        session_id: 'new-session-456',
        service_id: 'default-service',
        input: '{"test":"data"}',
      });

      expect(createDeploymentTaskNowaitDeploymentsDeploymentNameTasksCreatePost).toHaveBeenCalledWith({
        client: mockClient,
        path: { deployment_name: 'test-deployment' },
        body: {
          input: '{"test":"data"}',
          service_id: undefined,
        },
      });
    });
  });

  describe('fetchTaskEvents', () => {
    const mockEvents = [
      {
        type: 'workflow.step.start',
        data: { step: 'step1' },
      },
      {
        type: 'workflow.step.complete',
        data: { step: 'step1', result: 'success' },
      },
    ];

    it('should successfully fetch and stream events', async () => {
      const mockCallback = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onFinish: vi.fn(),
        onStopEvent: vi.fn(),
      };

      // Mock the streaming manager
      const mockPromise = Promise.resolve(mockEvents);
      vi.mocked(workflowStreamingManager.subscribe).mockReturnValue({
        promise: mockPromise,
        unsubscribe: vi.fn(),
      });

      const result = await fetchTaskEvents(
        {
          client: mockClient,
          deploymentName: 'test-deployment',
          task: mockTask,
        },
        mockCallback
      );

      expect(result).toEqual(mockEvents);
      expect(workflowStreamingManager.subscribe).toHaveBeenCalledWith(
        'task:task-123:test-deployment',
        expect.objectContaining({
          onStart: mockCallback.onStart,
          onData: mockCallback.onData,
          onError: mockCallback.onError,
          onFinish: mockCallback.onFinish,
        }),
        expect.any(Function),
        undefined
      );
    });

    it('should handle streaming with abort signal', async () => {
      const abortController = new AbortController();
      const mockCallback = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onFinish: vi.fn(),
      };

      const mockPromise = Promise.resolve(mockEvents);
      vi.mocked(workflowStreamingManager.subscribe).mockReturnValue({
        promise: mockPromise,
        unsubscribe: vi.fn(),
      });

      const result = await fetchTaskEvents(
        {
          client: mockClient,
          deploymentName: 'test-deployment',
          task: mockTask,
          signal: abortController.signal,
        },
        mockCallback
      );

      expect(result).toEqual(mockEvents);
      expect(workflowStreamingManager.subscribe).toHaveBeenCalledWith(
        'task:task-123:test-deployment',
        expect.any(Object),
        expect.any(Function),
        abortController.signal
      );
    });

    it('should work without callback parameter', async () => {
      const mockPromise = Promise.resolve(mockEvents);
      vi.mocked(workflowStreamingManager.subscribe).mockReturnValue({
        promise: mockPromise,
        unsubscribe: vi.fn(),
      });

      const result = await fetchTaskEvents({
        client: mockClient,
        deploymentName: 'test-deployment',
        task: mockTask,
      });

      expect(result).toEqual(mockEvents);
      expect(workflowStreamingManager.subscribe).toHaveBeenCalledWith(
        'task:task-123:test-deployment',
        expect.objectContaining({
          onStart: undefined,
          onData: undefined,
          onError: undefined,
          onFinish: undefined,
        }),
        expect.any(Function),
        undefined
      );
    });
  });

  describe('sendEventToTask', () => {
    it('should successfully send event to task', async () => {
      const mockResponse = {
        data: { success: true },
      };

      const mockEvent: WorkflowEvent = {
        type: 'user.input',
        data: { message: 'Hello' },
      };

      const { sendEventDeploymentsDeploymentNameTasksTaskIdEventsPost } = await import('@llamaindex/llama-deploy');
      vi.mocked(sendEventDeploymentsDeploymentNameTasksTaskIdEventsPost).mockResolvedValue(mockResponse as any);

      const result = await sendEventToTask({
        client: mockClient,
        deploymentName: 'test-deployment',
        task: mockTask,
        event: mockEvent,
      });

      expect(result).toEqual({ success: true });
      expect(sendEventDeploymentsDeploymentNameTasksTaskIdEventsPost).toHaveBeenCalledWith({
        client: mockClient,
        path: { deployment_name: 'test-deployment', task_id: 'task-123' },
        query: { session_id: 'session-456' },
        body: {
          service_id: 'workflow-service',
          event_obj_str: JSON.stringify({
            __is_pydantic: true,
            value: { message: 'Hello' },
            qualified_name: 'user.input',
          }),
        },
      });
    });

    it('should handle event with empty data', async () => {
      const mockResponse = {
        data: { success: true },
      };

      const mockEvent: WorkflowEvent = {
        type: 'empty.event',
        data: {},
      };

      const { sendEventDeploymentsDeploymentNameTasksTaskIdEventsPost } = await import('@llamaindex/llama-deploy');
      vi.mocked(sendEventDeploymentsDeploymentNameTasksTaskIdEventsPost).mockResolvedValue(mockResponse as any);

      const result = await sendEventToTask({
        client: mockClient,
        deploymentName: 'test-deployment',
        task: mockTask,
        event: mockEvent,
      });

      expect(result).toEqual({ success: true });
      expect(sendEventDeploymentsDeploymentNameTasksTaskIdEventsPost).toHaveBeenCalledWith({
        client: mockClient,
        path: { deployment_name: 'test-deployment', task_id: 'task-123' },
        query: { session_id: 'session-456' },
        body: {
          service_id: 'workflow-service',
          event_obj_str: JSON.stringify({
            __is_pydantic: true,
            value: {},
            qualified_name: 'empty.event',
          }),
        },
      });
    });
  });

  describe('Internal utility functions coverage', () => {
    it('should call streaming manager with correct parameters', async () => {
      const mockEvents = [{ type: 'test.event', data: { test: 'data' } }];
      const mockPromise = Promise.resolve(mockEvents);
      
      vi.mocked(workflowStreamingManager.subscribe).mockReturnValue({
        promise: mockPromise,
        unsubscribe: vi.fn(),
      });

      const result = await fetchTaskEvents({
        client: mockClient,
        deploymentName: 'test-deployment',
        task: mockTask,
      });

      expect(result).toEqual(mockEvents);
      expect(workflowStreamingManager.subscribe).toHaveBeenCalledWith(
        'task:task-123:test-deployment',
        expect.any(Object),
        expect.any(Function),
        undefined
      );
    });

    it('should handle streaming errors', async () => {
      const mockError = new Error('Streaming failed');
      const mockPromise = Promise.reject(mockError);
      
      vi.mocked(workflowStreamingManager.subscribe).mockReturnValue({
        promise: mockPromise,
        unsubscribe: vi.fn(),
      });

      await expect(
        fetchTaskEvents({
          client: mockClient,
          deploymentName: 'test-deployment',
          task: mockTask,
        })
      ).rejects.toThrow('Streaming failed');
    });

    it('should pass callback functions to subscriber', async () => {
      const mockEvents = [{ type: 'test.event', data: { test: 'data' } }];
      const mockPromise = Promise.resolve(mockEvents);
      
      const mockCallback = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onFinish: vi.fn(),
        onStopEvent: vi.fn(),
      };

      vi.mocked(workflowStreamingManager.subscribe).mockReturnValue({
        promise: mockPromise,
        unsubscribe: vi.fn(),
      });

      await fetchTaskEvents({
        client: mockClient,
        deploymentName: 'test-deployment',
        task: mockTask,
      }, mockCallback);

      expect(workflowStreamingManager.subscribe).toHaveBeenCalledWith(
        'task:task-123:test-deployment',
        expect.objectContaining({
          onStart: mockCallback.onStart,
          onData: mockCallback.onData,
          onError: mockCallback.onError,
          onFinish: mockCallback.onFinish,
        }),
        expect.any(Function),
        undefined
      );
    });
  });
});