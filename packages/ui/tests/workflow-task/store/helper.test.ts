/**
 * Test cases for helper.ts functions
 * Testing API calls, event streaming, and utility functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getExistingTask,
  createTask,
  fetchTaskEvents,
  sendEventToTask,
} from '../../../src/workflow-task/store/helper';
import { workflowStreamingManager } from '../../../src/lib/shared-streaming';
import type { WorkflowTask, WorkflowEvent } from '../../../src/workflow-task/types';

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

  const mockTask: WorkflowTask = {
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

    it('should throw error when task has missing required fields', async () => {
      const mockResponse = {
        data: [
          {
            task_id: 'task-123',
            session_id: 'session-456',
            // Missing service_id and input
          },
        ],
      };

      const { getTasksDeploymentsDeploymentNameTasksGet } = await import('@llamaindex/llama-deploy');
      vi.mocked(getTasksDeploymentsDeploymentNameTasksGet).mockResolvedValue(mockResponse as any);

      await expect(
        getExistingTask({
          client: mockClient,
          deploymentName: 'test-deployment',
          taskId: 'task-123',
        })
      ).rejects.toThrow('Task is found but missing one of the required fields');
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

    it('should throw error when created task has missing fields', async () => {
      const mockResponse = {
        data: {
          task_id: 'new-task-123',
          // Missing required fields
        },
      };

      const { createDeploymentTaskNowaitDeploymentsDeploymentNameTasksCreatePost } = await import('@llamaindex/llama-deploy');
      vi.mocked(createDeploymentTaskNowaitDeploymentsDeploymentNameTasksCreatePost).mockResolvedValue(mockResponse as any);

      await expect(
        createTask({
          client: mockClient,
          deploymentName: 'test-deployment',
          eventData: { test: 'data' },
        })
      ).rejects.toThrow('Task is created but missing one of the required fields');
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