/**
 * Test cases for useWorkflowTaskCreate hook (H1-H2)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowTaskCreate } from '../../../src/workflow-task/hooks/use-workflow-task-create';
import { useTaskStore } from '../../../src/workflow-task/store/task-store';
import type { WorkflowTaskSummary } from '../../../src/workflow-task/types';

// Mock the helper functions  
vi.mock('../../../src/workflow-task/store/helper', () => ({
  createTask: vi.fn(),
  fetchTaskEvents: vi.fn(),
}));

// Mock the shared streaming manager
vi.mock('../../../src/lib/shared-streaming', () => ({
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useWorkflowTaskCreate', () => {
  const mockTask: WorkflowTaskSummary = {
    task_id: 'test-task-1',
    session_id: 'session-1',
    service_id: 'workflow-1',
    input: 'test input',
    deployment: 'test-deployment',
    status: 'running',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
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

  describe('H1: Success creates and writes to store', () => {
    it('should have isCreating true then false, and store should contain new task with running status', async () => {
      // Mock successful API response
      const { createTask: createTaskAPI } = await import('../../../src/workflow-task/store/helper');
      vi.mocked(createTaskAPI).mockResolvedValue(mockTask);
      
      const { result } = renderHook(() => useWorkflowTaskCreate());
      
      // Initial state
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Get initial store state
      const initialTasksCount = Object.keys(useTaskStore.getState().tasks).length;
      
      // Start creation
      let createPromise: Promise<WorkflowTaskSummary>;
      act(() => {
        createPromise = result.current.createTask('test-deployment', 'test input');
      });
      
      // Should be creating
      expect(result.current.isCreating).toBe(true);
      
      // Wait for completion
      await act(async () => {
        await createPromise!;
      });
      
      // Should be done creating
      expect(result.current.isCreating).toBe(false);
      
      // Check store has a new task with running status
      const { tasks } = useTaskStore.getState();
      const newTasksCount = Object.keys(tasks).length;
      expect(newTasksCount).toBe(initialTasksCount + 1);
      
      // Find the newly created task
      const newTask = Object.values(tasks)[0];
      expect(newTask.status).toBe('running');
      expect(newTask.deployment).toBe('test-deployment');
      expect(newTask.input).toBe('test input');
    });
  });

  describe('H2: Backend error returns error and does not write store', () => {
    it('should capture error and not change store tasks count', async () => {
      // Mock API error
      const { createTask: createTaskAPI } = await import('../../../src/workflow-task/store/helper');
      const testError = new Error('API Error');
      vi.mocked(createTaskAPI).mockRejectedValue(testError);
      
      const { result } = renderHook(() => useWorkflowTaskCreate());
      
      // Get initial store state
      const initialTasksCount = Object.keys(useTaskStore.getState().tasks).length;
      
      // Initial state
      expect(result.current.error).toBe(null);
      expect(result.current.isCreating).toBe(false);
      
      // Start creation that will fail
      let createPromise: Promise<WorkflowTaskSummary>;
      act(() => {
        createPromise = result.current.createTask('test-deployment', 'test input');
      });
      
      // Should be creating
      expect(result.current.isCreating).toBe(true);
      
      // Wait for error
      await act(async () => {
        try {
          await createPromise!;
        } catch (err) {
          // Expected to throw
        }
      });
      
      // Should be done creating and have error
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBe(testError);
      
      // Store tasks count should remain unchanged
      const { tasks } = useTaskStore.getState();
      expect(Object.keys(tasks).length).toBe(initialTasksCount);
    });
  });
});