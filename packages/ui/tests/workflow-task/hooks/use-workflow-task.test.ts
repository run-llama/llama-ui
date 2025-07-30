/**
 * Test cases for useWorkflowTask hook (H6-H8)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowTask } from '../../../src/workflow-task/hooks/use-workflow-task';
import { useTaskStore } from '../../../src/workflow-task/store/task-store';
import { workflowStreamingManager } from '../../../src/lib/shared-streaming';
import type { WorkflowTaskSummary, WorkflowEvent } from '../../../src/workflow-task/types';

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
  const mockSubscribe = vi.fn();
  const mockIsStreamActive = vi.fn();
  const mockCloseStream = vi.fn();

  mockSubscribe.mockReturnValue({
    promise: Promise.resolve([]),
    unsubscribe: mockUnsubscribe,
  });

  return {
    workflowStreamingManager: {
      subscribe: mockSubscribe,
      isStreamActive: mockIsStreamActive,
      closeStream: mockCloseStream,
    },
  };
});

describe('useWorkflowTask', () => {
  const mockTask: WorkflowTaskSummary = {
    task_id: 'task-1',
    session_id: 'session-1',
    service_id: 'workflow-1',
    input: 'test input',
    deployment: 'test-deployment',
    status: 'running',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockEvent1: WorkflowEvent = {
    type: 'event1',
    data: 'data1',
  };

  const mockEvent2: WorkflowEvent = {
    type: 'event2',
    data: 'data2',
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
    
    // Set default mock return values
    vi.mocked(workflowStreamingManager.isStreamActive).mockReturnValue(false);
  });

  describe('H6: Mount subscribes and accumulates events', () => {
    it('should have events.length === 2 after simulating two events', async () => {
      // Setup task in store
      useTaskStore.setState({
        tasks: { [mockTask.task_id]: mockTask },
        events: {},
      });
      
      // Mock subscriber behavior
      let subscriber: any;
      vi.mocked(workflowStreamingManager.subscribe).mockImplementation((taskId, sub, executor) => {
        subscriber = sub;
        return {
          promise: Promise.resolve([]),
          unsubscribe: vi.fn(),
        };
      });
      
      const { result } = renderHook(() => useWorkflowTask(mockTask.task_id));
      
      // Verify subscription was called
      expect(workflowStreamingManager.subscribe).toHaveBeenCalledWith(
        `task:${mockTask.task_id}:${mockTask.deployment}`,
        expect.any(Object),
        expect.any(Function),
        undefined
      );
      
      // Simulate two events arriving
      act(() => {
        subscriber?.onData?.(mockEvent1);
      });
      
      act(() => {
        subscriber?.onData?.(mockEvent2);
      });
      
      // Events should be accumulated in store
      const { events } = useTaskStore.getState();
      expect(events[mockTask.task_id]).toHaveLength(2);
      
      // Hook should return the events
      expect(result.current.events).toHaveLength(2);
    });
  });

  describe('H7: clearEvents empties events array', () => {
    it('should have events.length === 0 after clearEvents', () => {
      // Setup task with events
      useTaskStore.setState({
        tasks: { [mockTask.task_id]: mockTask },
        events: { [mockTask.task_id]: [mockEvent1, mockEvent2] },
      });
      
      const { result } = renderHook(() => useWorkflowTask(mockTask.task_id));
      
      // Initial events should be present
      expect(result.current.events).toHaveLength(2);
      
      // Call clearEvents
      act(() => {
        result.current.clearEvents();
      });
      
      // Events should be cleared
      expect(result.current.events).toHaveLength(0);
    });
  });

  describe('H8: stopStreaming ends stream and updates isStreaming', () => {
    it('should call closeStream when stopStreaming is called', async () => {
      // Setup task
      useTaskStore.setState({
        tasks: { [mockTask.task_id]: mockTask },
        events: {},
      });
      
      const { result } = renderHook(() => useWorkflowTask(mockTask.task_id));
      
      // Verify subscription was made
      expect(workflowStreamingManager.subscribe).toHaveBeenCalled();
      
      // Call stopStreaming
      act(() => {
        result.current.stopStreaming();
      });
      
      // Should have called closeStream with the correct stream key
      expect(workflowStreamingManager.closeStream).toHaveBeenCalledWith(
        `task:${mockTask.task_id}:${mockTask.deployment}`
      );
      
      // isStreaming should reflect the streaming manager state
      vi.mocked(workflowStreamingManager.isStreamActive).mockReturnValue(false);
      expect(result.current.isStreaming).toBe(false);
    });
  });
});