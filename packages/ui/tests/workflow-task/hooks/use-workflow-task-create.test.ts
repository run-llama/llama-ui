/**
 * Test cases for useWorkflowTaskCreate hook (H1-H2)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useWorkflowTaskCreate } from '../../../src/workflow-task/hooks/use-workflow-task-create';
import { renderHookWithProvider } from '../../test-utils';
import type { WorkflowTaskSummary } from '../../../src/workflow-task/types';

// Mock the helper functions  
vi.mock('../../../src/workflow-task/store/helper', () => ({
  createTask: vi.fn(),
  fetchTaskEvents: vi.fn().mockResolvedValue(undefined),
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
  };

  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('H1: Success creates and writes to store', () => {
    it('should have isCreating true then false, and return created task', async () => {
      // Mock successful API response
      const { createTask: createTaskAPI } = await import('../../../src/workflow-task/store/helper');
      vi.mocked(createTaskAPI).mockResolvedValue(mockTask);
      
      const { result } = renderHookWithProvider(() => useWorkflowTaskCreate());
      
      // Initial state
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Start creation
      let createPromise: Promise<WorkflowTaskSummary>;
      act(() => {
        createPromise = result.current.createTask('test-deployment', 'test input');
      });
      
      // Should be creating
      expect(result.current.isCreating).toBe(true);
      
      // Wait for completion and get result
      let createdTask: WorkflowTaskSummary;
      await act(async () => {
        createdTask = await createPromise!;
      });
      
      // Should be done creating
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBe(null);
      
      // Verify the created task is returned correctly
      expect(createdTask!.task_id).toBe(mockTask.task_id);
      expect(createdTask!.deployment).toBe('test-deployment');
      expect(createdTask!.input).toBe('test input');
      
      // Verify the API was called correctly
      expect(createTaskAPI).toHaveBeenCalledWith({
        client: expect.any(Object),
        deploymentName: 'test-deployment',
        eventData: 'test input',
        workflow: undefined
      });
    });
  });

  describe('H2: Backend error returns error and does not write store', () => {
    it('should capture error and set error state', async () => {
      // Mock API error
      const { createTask: createTaskAPI } = await import('../../../src/workflow-task/store/helper');
      const testError = new Error('API Error');
      vi.mocked(createTaskAPI).mockRejectedValue(testError);
      
      const { result } = renderHookWithProvider(() => useWorkflowTaskCreate());
      
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
        } catch {
          // Expected to throw
        }
      });
      
      // Should be done creating and have error
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBe(testError);
      
      // Verify the API was called
      expect(createTaskAPI).toHaveBeenCalledWith({
        client: expect.any(Object),
        deploymentName: 'test-deployment',
        eventData: 'test input',
        workflow: undefined
      });
    });
  });
});