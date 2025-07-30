/**
 * Test cases for useWorkflowTaskList hook (H3-H5)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowTaskList } from '../../../src/workflow-task/hooks/use-workflow-task-list';
import { useTaskStore } from '../../../src/workflow-task/store/task-store';
import { workflowStreamingManager } from '../../../src/lib/shared-streaming';
import type { WorkflowTaskSummary } from '../../../src/workflow-task/types';

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the streaming manager
vi.mock('../../../src/lib/shared-streaming', () => {
  const mockUnsubscribe = vi.fn();
  return {
    workflowStreamingManager: {
      subscribe: vi.fn().mockReturnValue({
        promise: Promise.resolve([]),
        unsubscribe: mockUnsubscribe,
      }),
      isStreamActive: vi.fn().mockReturnValue(false),
      closeStream: vi.fn(),
    },
  };
});

describe('useWorkflowTaskList', () => {
  const mockTask1: WorkflowTaskSummary = {
    task_id: 'task-1',
    session_id: 'session-1',
    service_id: 'workflow-1',
    input: 'test input 1',
    deployment: 'test-deployment',
    status: 'running',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockTask2: WorkflowTaskSummary = {
    task_id: 'task-2',
    session_id: 'session-2',
    service_id: 'workflow-2',
    input: 'test input 2',
    deployment: 'test-deployment',
    status: 'complete',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
  };

  beforeEach(() => {
    // Reset store state
    useTaskStore.setState({
      tasks: {},
      events: {},
    });
    
    // Clear localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('H3: Initial render reads persisted tasks', () => {
    it('should return array length of 2 when localStorage has two tasks', () => {
      // Pre-populate localStorage with two tasks
      const persistedData = {
        state: {
          tasks: {
            'task-1': mockTask1,
            'task-2': mockTask2,
          },
        },
        version: 0,
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedData));
      
      // Set initial store state to simulate rehydration
      useTaskStore.setState({
        tasks: {
          'task-1': mockTask1,
          'task-2': mockTask2,
        },
        events: {},
      });
      
      const { result } = renderHook(() => useWorkflowTaskList());
      
      expect(result.current.tasks).toHaveLength(2);
    });
  });

  describe('H4: Auto-stream for running tasks', () => {
    it('should call streamingManager.subscribe once when running task is inserted', async () => {
      const { result } = renderHook(() => useWorkflowTaskList());
      
      // Insert a running task
      act(() => {
        useTaskStore.setState(state => ({
          tasks: { ...state.tasks, [mockTask1.task_id]: mockTask1 }
        }));
      });
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(workflowStreamingManager.subscribe).toHaveBeenCalledTimes(1);
      expect(workflowStreamingManager.subscribe).toHaveBeenCalledWith(
        `task:${mockTask1.task_id}:${mockTask1.deployment}`,
        expect.any(Object),
        expect.any(Function),
        undefined
      );
    });

    it('should not subscribe for completed tasks', async () => {
      const { result } = renderHook(() => useWorkflowTaskList());
      
      // Insert a completed task
      act(() => {
        useTaskStore.setState(state => ({
          tasks: { ...state.tasks, [mockTask2.task_id]: mockTask2 }
        }));
      });
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(workflowStreamingManager.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('H5: clearCompleted removes only complete/error tasks', () => {
    it('should only keep running tasks after clearCompleted', () => {
      const runningTask = { ...mockTask1, status: 'running' as const };
      const completeTask = { ...mockTask2, task_id: 'task-2', status: 'complete' as const };
      const errorTask = { ...mockTask2, task_id: 'task-3', status: 'error' as const };
      
      // Pre-populate store with three tasks
      useTaskStore.setState({
        tasks: {
          [runningTask.task_id]: runningTask,
          [completeTask.task_id]: completeTask,
          [errorTask.task_id]: errorTask,
        },
        events: {},
      });
      
      const { result } = renderHook(() => useWorkflowTaskList());
      
      // Initial state should have 3 tasks
      expect(result.current.tasks).toHaveLength(3);
      
      // Call clearCompleted
      act(() => {
        result.current.clearCompleted();
      });
      
      // Should only have the running task remaining
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].status).toBe('running');
    });
  });
});