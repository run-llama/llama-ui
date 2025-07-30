import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { 
  useWorkflowTask,
} from '../../src/hooks/use-workflow-task/use-workflow-task-detail';
import { WorkflowTaskProvider } from '../../src/hooks/use-workflow-task/use-workflow-task-provider';
import { WorkflowTaskSummary, DetailedWorkflowTask } from '../../src/hooks/use-workflow-task/types';
import { WorkflowEvent } from '../../src/hooks/use-workflow/types';
// TaskServiceListener removed - using direct streaming callbacks instead

// Global test timeout for all tests in this file
vi.setConfig({ testTimeout: 5000 });

// Mock @llamaindex/llama-deploy
vi.mock('@llamaindex/llama-deploy', () => ({
  createClient: vi.fn(() => ({})),
  createConfig: vi.fn(() => ({})),
}));

// Mock the workflow‑task service once — it will always return the
// `mockServiceInstance` that we reset in each test’s `beforeEach`
vi.mock('../../src/hooks/use-workflow-task/workflow-task.service', () => ({
  WorkflowTaskService: vi.fn(() => mockServiceInstance),
}));

// Fresh mock instance will be created in each test
let mockServiceInstance: any;

describe('useWorkflowTask', () => {

  const createMockTask = (id: string = 'test-task-1'): WorkflowTaskSummary => ({
    task_id: id,
    session_id: 'session-123',
    service_id: 'service-abc',
    input: 'test input',
    deployment: 'test-deployment',
    status: 'running',
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z'),
  });

  const createDetailedMockTask = (id: string = 'test-task-1'): DetailedWorkflowTask => ({
    ...createMockTask(id),
    events: [],
    isStreaming: false,
    error: null,
  });

  const createMockEvent = (data: any = { message: 'test' }): WorkflowEvent => ({
    type: 'test-event',
    data,
  });
  
  let wrapper: React.FC<{children: React.ReactNode}>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    // Listeners removed - using direct streaming callbacks instead

    mockServiceInstance = {
      getTask: vi.fn((_taskId: string, _deployment: string) => Promise.resolve(null)),
      // subscribe method removed - no longer needed
      startTaskStreaming: vi.fn(() => Promise.resolve()),
      stopTaskStreaming: vi.fn(() => {}),
      clearTaskEvents: vi.fn(() => {}),
    };

    // Create wrapper with provider
    wrapper = ({ children }) => (
      <WorkflowTaskProvider>
        {children}
      </WorkflowTaskProvider>
    );
  });

  it('should not fetch task if taskId is not provided', () => {
    const { result } = renderHook(() => useWorkflowTask('', 'test-deployment'), { wrapper });
    expect(mockServiceInstance.getTask).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch and set task details on mount', async () => {
    const mockDetailedTask = createDetailedMockTask();
    mockServiceInstance.getTask.mockResolvedValue(mockDetailedTask);

    const { result } = renderHook(
      () => useWorkflowTask('test-task-1', 'test-deployment'), 
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(mockServiceInstance.getTask).toHaveBeenCalledWith('test-task-1', 'test-deployment');
      expect(result.current.task).toEqual(expect.objectContaining({ task_id: 'test-task-1' }));
      expect(result.current.events).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle task not found', async () => {
    mockServiceInstance.getTask.mockResolvedValue(null);

    const { result } = renderHook(
      () => useWorkflowTask('non-existent-task', 'test-deployment'), 
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.task).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch');
    mockServiceInstance.getTask.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useWorkflowTask('test-task-1', 'test-deployment'), 
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(mockError);
    });
  });

  it('should start streaming for a running task', async () => {
    const mockDetailedTask = createDetailedMockTask();
    mockServiceInstance.getTask.mockResolvedValue(mockDetailedTask);

    renderHook(
      () => useWorkflowTask('test-task-1', 'test-deployment'), 
      { wrapper }
    );

    await waitFor(() => {
      expect(mockServiceInstance.startTaskStreaming).toHaveBeenCalledWith(
        'test-task-1',
        'test-deployment',
        expect.any(Object)
      );
    });
  });

  it('should not start streaming for a completed task', async () => {
    const mockDetailedTask = { ...createDetailedMockTask(), status: 'complete' as const };
    mockServiceInstance.getTask.mockResolvedValue(mockDetailedTask);

    renderHook(
      () => useWorkflowTask('test-task-1', 'test-deployment'), 
      { wrapper }
    );

    await waitFor(() => {
      expect(mockServiceInstance.startTaskStreaming).not.toHaveBeenCalled();
    });
  });

  it('should stop streaming on unmount', async () => {
    const mockDetailedTask = createDetailedMockTask();
    mockServiceInstance.getTask.mockResolvedValue(mockDetailedTask);

    const { unmount } = renderHook(
      () => useWorkflowTask('test-task-1', 'test-deployment'), 
      { wrapper }
    );
    
    await waitFor(() => {
      expect(mockServiceInstance.startTaskStreaming).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(mockServiceInstance.stopTaskStreaming).toHaveBeenCalledWith('test-task-1');
  });

  it('should update events from streaming callback', async () => {
    const mockDetailedTask = createDetailedMockTask();
    let streamCallbacks: any = {};
    mockServiceInstance.getTask.mockResolvedValue(mockDetailedTask);
    mockServiceInstance.startTaskStreaming.mockImplementation((_taskId: any, _deployment: any, callbacks: any) => {
      streamCallbacks = callbacks;
      return Promise.resolve();
    });

    const { result } = renderHook(
      () => useWorkflowTask('test-task-1', 'test-deployment'), 
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.task).toBeTruthy();
    });
    
    const newEvent = createMockEvent({ update: 1 });
    act(() => {
      streamCallbacks.onData?.(newEvent, mockDetailedTask);
    });

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toEqual(newEvent);
    });
  });
});