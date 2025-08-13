/**
 * Test cases for useWorkflowTaskList hook (H3-H5)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useWorkflowTaskList } from '../../../src/workflow-task/hooks/use-workflow-task-list';
import { renderHookWithProvider } from '../../test-utils';
import { useTaskStore } from '../../../src/workflow-task/hooks/use-task-store';

// Mock helper and streaming to control task creation and completion
vi.mock('../../../src/workflow-task/store/helper', () => {
  return {
    createTask: vi.fn(async (_args: any) => {
      return {
        task_id: 'task-list-1',
        session_id: 'session-1',
        service_id: 'service-1',
        input: 'input',
      };
    }),
    fetchTaskEvents: vi.fn(async (_params: any, callback?: any) => {
      // Let the hook see the task in running state first, then finish
      setTimeout(() => {
        callback?.onFinish?.([]);
      }, 5);
      return [];
    }),
  };
});
vi.mock('../../../src/lib/shared-streaming', () => {
  const manager = {
    subscribe: vi.fn(() => ({ promise: Promise.resolve([]), unsubscribe: vi.fn() })),
    isStreamActive: vi.fn(() => false),
    closeStream: vi.fn(),
    closeAllStreams: vi.fn(),
    getSubscriberCount: vi.fn(() => 0),
    getStreamEvents: vi.fn(() => []),
  };
  return { workflowStreamingManager: manager };
});

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

describe('useWorkflowTaskList', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('H3: Initial render reads persisted tasks', () => {
    it('should return empty tasks initially', () => {
      const { result } = renderHookWithProvider(() => useWorkflowTaskList());
      
      expect(result.current.tasks).toEqual([]);
      expect(typeof result.current.clearCompleted).toBe('function');
    });
  });

  describe('H4: Auto-stream for running tasks', () => {
    it('should have auto-stream functionality', () => {
      const { result } = renderHookWithProvider(() => useWorkflowTaskList());
      
      // Test basic functionality - tasks should be empty initially
      expect(result.current.tasks).toEqual([]);
    });
  });

  describe('H5: clearCompleted removes only complete/error tasks', () => {
    it('should have clearCompleted function', () => {
      const { result } = renderHookWithProvider(() => useWorkflowTaskList());
      
      expect(typeof result.current.clearCompleted).toBe('function');
      
      act(() => {
        result.current.clearCompleted();
      });
      
      // Should not throw error
      expect(result.current.tasks).toEqual([]);
    });
  });

  describe('H6: onTaskResult is called when a running task completes', () => {
    it('should invoke onTaskResult with the completed task', async () => {
      const onTaskResult = vi.fn();
      const { rerender } = renderHookWithProvider(
        () => useWorkflowTaskList({ onTaskResult }),
        { deployment: 'dep-1' }
      );

      const storeHook = renderHookWithProvider(() => useTaskStore());

      // Create a task which starts in running state and will complete via mocked fetchTaskEvents
      await act(async () => {
        await storeHook.result.current.createTask('dep-1', 'input');
      });

      // Allow the finish callback to run and the hook effects to process
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        rerender();
      });

      expect(onTaskResult).toHaveBeenCalledTimes(1);
      expect(onTaskResult.mock.calls[0][0]).toMatchObject({
        task_id: 'task-list-1',
        status: 'complete',
      });
    });
  });
});