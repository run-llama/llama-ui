/**
 * Test cases for useWorkflowProgress hook (H9)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowProgress } from '../../../src/workflow-task/hooks/use-workflow-progress';
import { useTaskStore } from '../../../src/workflow-task/store/task-store';
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

describe('useWorkflowProgress', () => {
  const createMockTask = (taskId: string, status: 'idle' | 'running' | 'complete' | 'error'): WorkflowTaskSummary => ({
    task_id: taskId,
    session_id: `session-${taskId}`,
    service_id: `workflow-${taskId}`,
    input: `input for ${taskId}`,
    deployment: 'test-deployment',
    status,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  });

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

  describe('H9: Correctly calculates current/total/status', () => {
    it('should return {current:2, total:3, status:"running"} for 2 complete + 1 running tasks', () => {
      const completeTask1 = createMockTask('task-1', 'complete');
      const completeTask2 = createMockTask('task-2', 'complete');
      const runningTask = createMockTask('task-3', 'running');
      
      // Setup store with tasks
      useTaskStore.setState({
        tasks: {
          [completeTask1.task_id]: completeTask1,
          [completeTask2.task_id]: completeTask2,
          [runningTask.task_id]: runningTask,
        },
        events: {},
      });
      
      const { result } = renderHook(() => useWorkflowProgress());
      
      expect(result.current.current).toBe(2);
      expect(result.current.total).toBe(3);
      expect(result.current.status).toBe('running');
    });

    it('should return {current:3, total:3, status:"complete"} for all complete tasks', () => {
      const completeTask1 = createMockTask('task-1', 'complete');
      const completeTask2 = createMockTask('task-2', 'complete');
      const completeTask3 = createMockTask('task-3', 'complete');
      
      // Setup store with tasks
      useTaskStore.setState({
        tasks: {
          [completeTask1.task_id]: completeTask1,
          [completeTask2.task_id]: completeTask2,
          [completeTask3.task_id]: completeTask3,
        },
        events: {},
      });
      
      const { result } = renderHook(() => useWorkflowProgress());
      
      expect(result.current.current).toBe(3);
      expect(result.current.total).toBe(3);
      expect(result.current.status).toBe('complete');
    });

    it('should return {current:1, total:3, status:"error"} when there is an error task', () => {
      const completeTask = createMockTask('task-1', 'complete');
      const errorTask = createMockTask('task-2', 'error');
      const runningTask = createMockTask('task-3', 'running');
      
      // Setup store with tasks
      useTaskStore.setState({
        tasks: {
          [completeTask.task_id]: completeTask,
          [errorTask.task_id]: errorTask,
          [runningTask.task_id]: runningTask,
        },
        events: {},
      });
      
      const { result } = renderHook(() => useWorkflowProgress());
      
      expect(result.current.current).toBe(1);
      expect(result.current.total).toBe(3);
      expect(result.current.status).toBe('error');
    });

    it('should return {current:0, total:0, status:"idle"} when no tasks', () => {
      const { result } = renderHook(() => useWorkflowProgress());
      
      expect(result.current.current).toBe(0);
      expect(result.current.total).toBe(0);
      expect(result.current.status).toBe('idle');
    });

    it('should return {current:0, total:2, status:"idle"} for only idle tasks', () => {
      const idleTask1 = createMockTask('task-1', 'idle');
      const idleTask2 = createMockTask('task-2', 'idle');
      
      // Setup store with tasks
      useTaskStore.setState({
        tasks: {
          [idleTask1.task_id]: idleTask1,
          [idleTask2.task_id]: idleTask2,
        },
        events: {},
      });
      
      const { result } = renderHook(() => useWorkflowProgress());
      
      expect(result.current.current).toBe(0);
      expect(result.current.total).toBe(2);
      expect(result.current.status).toBe('idle');
    });
  });
});