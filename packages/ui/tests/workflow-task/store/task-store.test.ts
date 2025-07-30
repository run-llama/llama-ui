/**
 * Complete unit tests for task store
 * 
 * Tests all core functionality including:
 * - Task creation and auto-subscription
 * - Event streaming callbacks (onData, onFinish, onError)
 * - Task management (clearCompleted, clearEvents)
 * - Subscription management (subscribe, unsubscribe, isSubscribed)
 * - Selective persistence (completed tasks not persisted)
 * - Error handling and edge cases
 * 
 * Coverage: 21 tests covering all public methods and internal logic
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTaskStore } from '../../../src/workflow-task/store/task-store';
import { createTask as createTaskAPI, fetchTaskEvents } from '../../../src/workflow-task/store/helper';
import { workflowStreamingManager } from '../../../src/lib/shared-streaming';
import type { WorkflowTaskSummary, WorkflowEvent } from '../../../src/workflow-task/types';

// Mock helper functions
vi.mock('../../../src/workflow-task/store/helper', () => ({
  createTask: vi.fn(),
  fetchTaskEvents: vi.fn(),
}));

// Mock shared streaming manager
vi.mock('../../../src/lib/shared-streaming', () => ({
  workflowStreamingManager: {
    subscribe: vi.fn(),
    closeStream: vi.fn(),
    isStreamActive: vi.fn(),
  },
}));

// Mock localStorage for testing
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
    get mockStore() { return store; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Complete Task Store Tests', () => {
  const mockWorkflowTask = {
    task_id: 'test-task-1',
    session_id: 'session-1',
    service_id: 'service-1',
    input: 'test input',
  };

  const createMockTask = (
    taskId: string, 
    status: 'idle' | 'running' | 'complete' | 'error' = 'running'
  ): WorkflowTaskSummary => ({
    task_id: taskId,
    session_id: 'session-1',
    service_id: 'service-1',
    input: 'test input',
    deployment: 'test-deployment',
    status,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  });

  const mockEvent: WorkflowEvent = {
    type: 'progress',
    data: 'test event data',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset store state
    useTaskStore.setState({
      tasks: {},
      events: {},
    });
    
    // Clear localStorage mock
    localStorageMock.clear();
    
    // Setup default mock implementations
    (createTaskAPI as any).mockResolvedValue(mockWorkflowTask);
    (fetchTaskEvents as any).mockResolvedValue([]);
    (workflowStreamingManager.isStreamActive as any).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createTask', () => {
    it('should create task and add to store', async () => {
      const { createTask } = useTaskStore.getState();
      
      const result = await createTask('test-deployment', 'test input');
      
      expect(result.task_id).toBe(mockWorkflowTask.task_id);
      expect(result.deployment).toBe('test-deployment');
      expect(result.status).toBe('running');
      
      const { tasks } = useTaskStore.getState();
      expect(tasks[mockWorkflowTask.task_id]).toBeDefined();
      expect(tasks[mockWorkflowTask.task_id]).toEqual(result);
    });

    it('should call createTaskAPI with correct parameters', async () => {
      const { createTask } = useTaskStore.getState();
      
      await createTask('test-deployment', 'test input', 'custom-workflow');
      
      expect(createTaskAPI).toHaveBeenCalledWith({
        client: expect.any(Object),
        deploymentName: 'test-deployment',
        eventData: 'test input',
        workflow: 'custom-workflow'
      });
    });

    it('should automatically call fetchTaskEvents for subscription', async () => {
      const { createTask } = useTaskStore.getState();
      
      await createTask('test-deployment', 'test input');
      
      expect(fetchTaskEvents).toHaveBeenCalledWith(
        {
          client: expect.any(Object),
          deploymentName: 'test-deployment',
          task: {
            task_id: mockWorkflowTask.task_id,
            session_id: mockWorkflowTask.session_id,
            service_id: mockWorkflowTask.service_id,
            input: mockWorkflowTask.input,
          }
        },
        expect.objectContaining({
          onData: expect.any(Function),
          onFinish: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should handle createTaskAPI errors', async () => {
      (createTaskAPI as any).mockRejectedValue(new Error('API Error'));
      
      const { createTask } = useTaskStore.getState();
      
      await expect(createTask('test-deployment', 'test input')).rejects.toThrow('API Error');
    });

    it('should handle fetchTaskEvents errors gracefully', async () => {
      (fetchTaskEvents as any).mockRejectedValue(new Error('Streaming Error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { createTask } = useTaskStore.getState();
      
      const result = await createTask('test-deployment', 'test input');
      
      // Task creation should still succeed
      expect(result.task_id).toBe(mockWorkflowTask.task_id);
      
      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to start task events streaming'),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle subscribe errors during task creation', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock subscribe to throw an error by making the store method fail
      const originalSubscribe = useTaskStore.getState().subscribe;
      useTaskStore.setState(state => ({
        ...state,
        subscribe: vi.fn(() => {
          throw new Error('Subscribe failed');
        })
      }));
      
      const { createTask } = useTaskStore.getState();
      
      const result = await createTask('test-deployment', 'test input');
      
      // Task creation should still succeed
      expect(result.task_id).toBe(mockWorkflowTask.task_id);
      
      // Error should be logged for auto-subscribe failure
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to auto-subscribe to task'),
        expect.any(Error)
      );
      
      // Restore original subscribe method
      useTaskStore.setState(state => ({
        ...state,
        subscribe: originalSubscribe
      }));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearCompleted', () => {
    it('should remove completed and error tasks', () => {
      const { clearCompleted } = useTaskStore.getState();
      
      const runningTask = createMockTask('task-1', 'running');
      const completeTask = createMockTask('task-2', 'complete');
      const errorTask = createMockTask('task-3', 'error');
      const idleTask = createMockTask('task-4', 'idle');
      
      // Add all tasks
      useTaskStore.setState({
        tasks: {
          'task-1': runningTask,
          'task-2': completeTask,
          'task-3': errorTask,
          'task-4': idleTask,
        },
        events: {}
      });
      
      clearCompleted();
      
      const { tasks } = useTaskStore.getState();
      expect(Object.keys(tasks)).toHaveLength(2);
      expect(tasks['task-1']).toBeDefined(); // running task kept
      expect(tasks['task-4']).toBeDefined(); // idle task kept
      expect(tasks['task-2']).toBeUndefined(); // complete task removed
      expect(tasks['task-3']).toBeUndefined(); // error task removed
    });

    it('should handle empty store', () => {
      const { clearCompleted } = useTaskStore.getState();
      
      clearCompleted();
      
      const { tasks } = useTaskStore.getState();
      expect(Object.keys(tasks)).toHaveLength(0);
    });
  });

  describe('clearEvents', () => {
    it('should clear events for specific task', () => {
      const { clearEvents } = useTaskStore.getState();
      
      // Setup events for multiple tasks
      useTaskStore.setState({
        tasks: {},
        events: {
          'task-1': [mockEvent, mockEvent],
          'task-2': [mockEvent],
        }
      });
      
      clearEvents('task-1');
      
      const { events } = useTaskStore.getState();
      expect(events['task-1']).toEqual([]);
      expect(events['task-2']).toHaveLength(1); // other task events unchanged
    });

    it('should handle non-existent task', () => {
      const { clearEvents } = useTaskStore.getState();
      
      clearEvents('non-existent-task');
      
      const { events } = useTaskStore.getState();
      expect(events['non-existent-task']).toEqual([]);
    });
  });

  describe('subscribe', () => {
    it('should not subscribe if task does not exist', () => {
      const { subscribe } = useTaskStore.getState();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      subscribe('non-existent-task', 'test-deployment');
      
      expect(fetchTaskEvents).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Task non-existent-task not found for subscription');
      
      consoleWarnSpy.mockRestore();
    });

    it('should subscribe to existing task', () => {
      const task = createMockTask('task-1');
      useTaskStore.setState({
        tasks: { 'task-1': task },
        events: {}
      });
      
      const { subscribe } = useTaskStore.getState();
      subscribe('task-1', 'test-deployment');
      
      expect(fetchTaskEvents).toHaveBeenCalledWith(
        {
          client: expect.any(Object),
          deploymentName: 'test-deployment',
          task: {
            task_id: task.task_id,
            session_id: task.session_id,
            service_id: task.service_id,
            input: task.input,
          }
        },
        expect.objectContaining({
          onData: expect.any(Function),
          onFinish: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });

  describe('unsubscribe', () => {
    it('should call workflowStreamingManager.closeStream', () => {
      const task = createMockTask('task-1');
      useTaskStore.setState({
        tasks: { 'task-1': task },
        events: {}
      });
      
      const { unsubscribe } = useTaskStore.getState();
      unsubscribe('task-1');
      
      expect(workflowStreamingManager.closeStream).toHaveBeenCalledWith('task:task-1:test-deployment');
    });

    it('should handle non-existent task', () => {
      const { unsubscribe } = useTaskStore.getState();
      
      unsubscribe('non-existent-task');
      
      expect(workflowStreamingManager.closeStream).not.toHaveBeenCalled();
    });
  });

  describe('isSubscribed', () => {
    it('should return streaming manager status for existing task', () => {
      (workflowStreamingManager.isStreamActive as any).mockReturnValue(true);
      
      const task = createMockTask('task-1');
      useTaskStore.setState({
        tasks: { 'task-1': task },
        events: {}
      });
      
      const { isSubscribed } = useTaskStore.getState();
      const result = isSubscribed('task-1');
      
      expect(result).toBe(true);
      expect(workflowStreamingManager.isStreamActive).toHaveBeenCalledWith('task:task-1:test-deployment');
    });

    it('should return false for non-existent task', () => {
      const { isSubscribed } = useTaskStore.getState();
      
      const result = isSubscribed('non-existent-task');
      
      expect(result).toBe(false);
      expect(workflowStreamingManager.isStreamActive).not.toHaveBeenCalled();
    });
  });

  describe('streaming callbacks', () => {
    let mockCallback: any;

    beforeEach(() => {
      const task = createMockTask('task-1');
      useTaskStore.setState({
        tasks: { 'task-1': task },
        events: {}
      });
      
             // Mock fetchTaskEvents to capture the callback
       (fetchTaskEvents as any).mockImplementation((params: any, callback: any) => {
         mockCallback = callback;
         return Promise.resolve([]);
       });
    });

    it('should handle onData callback', () => {
      const { subscribe } = useTaskStore.getState();
      subscribe('task-1', 'test-deployment');
      
      // Simulate onData callback
      mockCallback.onData(mockEvent);
      
      const { events } = useTaskStore.getState();
      expect(events['task-1']).toHaveLength(1);
      expect(events['task-1'][0]).toEqual(mockEvent);
    });

    it('should handle onFinish callback', () => {
      const { subscribe } = useTaskStore.getState();
      subscribe('task-1', 'test-deployment');
      
      // Simulate onFinish callback
      mockCallback.onFinish();
      
      const { tasks } = useTaskStore.getState();
      expect(tasks['task-1'].status).toBe('complete');
      expect(tasks['task-1'].updatedAt).toBeInstanceOf(Date);
    });

    it('should handle onError callback', () => {
      const { subscribe } = useTaskStore.getState();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      subscribe('task-1', 'test-deployment');
      
      // Simulate onError callback
      const error = new Error('Streaming error');
      mockCallback.onError(error);
      
      const { tasks } = useTaskStore.getState();
      expect(tasks['task-1'].status).toBe('error');
      expect(tasks['task-1'].updatedAt).toBeInstanceOf(Date);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Streaming error for task task-1:',
        error
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('selective persistence', () => {
    it('should only persist incomplete tasks in partialize function', () => {
      // We can't easily test the actual localStorage persistence in unit tests
      // but we can test the partialize function logic by accessing it
      const runningTask = createMockTask('task-1', 'running');
      const completeTask = createMockTask('task-2', 'complete');
      const errorTask = createMockTask('task-3', 'error');
      const idleTask = createMockTask('task-4', 'idle');
      
      const state = {
        tasks: {
          'task-1': runningTask,
          'task-2': completeTask,
          'task-3': errorTask,
          'task-4': idleTask,
        },
        events: { 'task-1': [mockEvent] },
        clearCompleted: vi.fn(),
        createTask: vi.fn(),
        clearEvents: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        isSubscribed: vi.fn(),
      };
      
      // Test partialize logic (simulating what happens in persist middleware)
      const result = useTaskStore.persist.getOptions().partialize!(state as any);
      
      expect(Object.keys(result.tasks)).toHaveLength(2);
      expect(result.tasks['task-1']).toBeDefined(); // running task persisted
      expect(result.tasks['task-4']).toBeDefined(); // idle task persisted
      expect(result.tasks['task-2']).toBeUndefined(); // complete task not persisted
      expect(result.tasks['task-3']).toBeUndefined(); // error task not persisted
      expect(result.events).toEqual({}); // events never persisted
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle malformed events gracefully', () => {
      const task = createMockTask('task-1');
      useTaskStore.setState({
        tasks: { 'task-1': task },
        events: {}
      });
      
      let mockCallback: any;
      (fetchTaskEvents as any).mockImplementation((params: any, callback: any) => {
        mockCallback = callback;
        return Promise.resolve([]);
      });
      
      const { subscribe } = useTaskStore.getState();
      subscribe('task-1', 'test-deployment');
      
      // Simulate malformed event
      const malformedEvent = { invalid: 'event' } as any;
      mockCallback.onData(malformedEvent);
      
      const { events } = useTaskStore.getState();
      expect(events['task-1']).toHaveLength(1);
      expect(events['task-1'][0]).toEqual(malformedEvent);
    });

    it('should handle multiple rapid events', () => {
      const task = createMockTask('task-1');
      useTaskStore.setState({
        tasks: { 'task-1': task },
        events: {}
      });
      
      let mockCallback: any;
      (fetchTaskEvents as any).mockImplementation((params: any, callback: any) => {
        mockCallback = callback;
        return Promise.resolve([]);
      });
      
      const { subscribe } = useTaskStore.getState();
      subscribe('task-1', 'test-deployment');
      
      // Simulate multiple rapid events
      for (let i = 0; i < 10; i++) {
        mockCallback.onData({ type: 'event', data: `data-${i}` });
      }
      
      const { events } = useTaskStore.getState();
      expect(events['task-1']).toHaveLength(10);
    });
  });

  describe('Duplicate Subscription Bug', () => {
    it('should not create duplicate events when multiple components subscribe to the same task', async () => {
      // Setup: Create a task first
      (createTaskAPI as any).mockResolvedValue({
        task_id: 'task-1',
        session_id: 'session-1',
        service_id: 'service-1',
        input: 'test input',
      });

      const { createTask } = useTaskStore.getState();
      await createTask('test-deployment', 'test input');

      // Reset mocks to track subscription calls
      vi.clearAllMocks();
      
      let subscriptionCount = 0;
      const mockCallbacks: any[] = [];
      let isSubscribed = false;

      // Mock workflowStreamingManager.isStreamActive to simulate subscription state
      (workflowStreamingManager.isStreamActive as any).mockImplementation((streamKey: string) => {
        console.log(`isStreamActive called for ${streamKey}, returning: ${isSubscribed}`);
        return isSubscribed;
      });

      // Mock fetchTaskEvents to track how many times it's called
      (fetchTaskEvents as any).mockImplementation((params: any, callback: any) => {
        subscriptionCount++;
        mockCallbacks.push(callback);
        isSubscribed = true; // Mark as subscribed after first call
        console.log(`fetchTaskEvents called ${subscriptionCount} times for task: ${params.task.task_id}`);
        console.log(`Setting isSubscribed = true`);
        return Promise.resolve([]);
      });

      const { subscribe } = useTaskStore.getState();

      // Simulate multiple components subscribing to the same task (like in the suite)
      // This simulates: TaskDetailSection + AgentStreamDisplay both calling useWorkflowTask
      console.log('=== First subscription (TaskDetailSection) ===');
      subscribe('task-1', 'test-deployment');
      
      console.log('=== Second subscription (AgentStreamDisplay) ===');
      subscribe('task-1', 'test-deployment');
      
      console.log('=== Third subscription (just to be sure) ===');
      subscribe('task-1', 'test-deployment');

      // Check how many times fetchTaskEvents was called
      console.log(`Total fetchTaskEvents calls: ${subscriptionCount}`);
      console.log(`Total callbacks created: ${mockCallbacks.length}`);
      
      // After the fix, this should be 1, not 3, to prevent duplicate subscriptions
      expect(subscriptionCount).toBe(1);
      expect(mockCallbacks).toHaveLength(1);

      // Now simulate an event coming in and check if it gets duplicated
      if (mockCallbacks.length > 0) {
        const testEvent = { type: 'AgentStream', data: { message: 'Test message' } };
        
        // Simulate all callbacks receiving the same event
        mockCallbacks.forEach((callback, index) => {
          console.log(`Calling callback ${index + 1} with event`);
          callback.onData(testEvent);
        });

        const { events } = useTaskStore.getState();
        console.log(`Events in store: ${JSON.stringify(events['task-1'])}`);
        
        // Event should only appear once, not multiple times
        expect(events['task-1']).toHaveLength(1);
        expect(events['task-1'][0]).toEqual(testEvent);
      }
    });
    
    it('should handle multiple tasks with their own subscriptions correctly', async () => {
      // Setup: Create two different tasks
      (createTaskAPI as any)
        .mockResolvedValueOnce({
          task_id: 'task-1',
          session_id: 'session-1', 
          service_id: 'service-1',
          input: 'test input 1',
        })
        .mockResolvedValueOnce({
          task_id: 'task-2',
          session_id: 'session-2',
          service_id: 'service-2', 
          input: 'test input 2',
        });

      const { createTask, subscribe } = useTaskStore.getState();
      await createTask('test-deployment', 'test input 1');
      await createTask('test-deployment', 'test input 2');

      // Reset mocks
      vi.clearAllMocks();
      
      let callCount = 0;
      const taskCallbacks: Record<string, any> = {};

      (fetchTaskEvents as any).mockImplementation((params: any, callback: any) => {
        callCount++;
        const taskId = params.task.task_id;
        taskCallbacks[taskId] = callback;
        return Promise.resolve([]);
      });

      // Subscribe to different tasks - this should work fine
      subscribe('task-1', 'test-deployment');
      subscribe('task-2', 'test-deployment');

      expect(callCount).toBe(2); // Two different tasks = two subscriptions OK
      expect(Object.keys(taskCallbacks)).toHaveLength(2);

      // Simulate events for each task
      taskCallbacks['task-1'].onData({ type: 'AgentStream', data: { message: 'Task 1 message' } });
      taskCallbacks['task-2'].onData({ type: 'AgentStream', data: { message: 'Task 2 message' } });

      const { events } = useTaskStore.getState();
      expect(events['task-1']).toHaveLength(1);
      expect(events['task-2']).toHaveLength(1);
      expect((events['task-1'][0].data as any).message).toBe('Task 1 message');
      expect((events['task-2'][0].data as any).message).toBe('Task 2 message');
    });
  });
}); 