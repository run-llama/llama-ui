import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useWorkflowTaskList } from '../../src/hooks/use-workflow-task/use-workflow-task-list';
import { WorkflowTaskProvider } from '../../src/hooks/use-workflow-task/use-workflow-task-provider';
import { WorkflowTaskSummary } from '../../src/hooks/use-workflow-task/types';
import { IWorkflowTaskService } from '../../src/hooks/use-workflow-task/workflow-task.service';

// Mock the service to control its behavior in tests
let mockServiceInstance: Partial<IWorkflowTaskService>;

vi.mock('../../src/hooks/use-workflow-task/use-workflow-task-provider', () => ({
  useWorkflowTaskService: () => mockServiceInstance,
  WorkflowTaskProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('useWorkflowTaskList', () => {
  let wrapper: React.FC<{children: React.ReactNode}>;

  const createMockTask = (id: string, status: 'running' | 'complete' = 'running'): WorkflowTaskSummary => ({
    task_id: id,
    session_id: `session-${id}`,
    service_id: 'service-abc',
    input: `input for ${id}`,
    deployment: 'test-deployment',
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockServiceInstance = {
      getTasks: vi.fn(),
      createTask: vi.fn(),
      clearCompletedTasks: vi.fn(),
      startTaskStreaming: vi.fn(() => Promise.resolve()),
      stopTaskStreaming: vi.fn(),
    };
    
    wrapper = ({ children }) => (
      <WorkflowTaskProvider>
        {children}
      </WorkflowTaskProvider>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load initial tasks from service', async () => {
    const initialTasks = [createMockTask('task-1')];
    (mockServiceInstance.getTasks as vi.Mock).mockReturnValue(initialTasks);

    const { result } = renderHook(() => useWorkflowTaskList(), { wrapper });

    await waitFor(() => {
      expect(result.current.tasks).toEqual(initialTasks);
      expect(mockServiceInstance.getTasks).toHaveBeenCalledTimes(1);
    });
  });

  it('should start streaming for running tasks', async () => {
    const tasks = [createMockTask('task-1', 'running'), createMockTask('task-2', 'complete')];
    (mockServiceInstance.getTasks as vi.Mock).mockReturnValue(tasks);

    renderHook(() => useWorkflowTaskList(), { wrapper });

    await waitFor(() => {
      expect(mockServiceInstance.startTaskStreaming).toHaveBeenCalledTimes(1);
      expect(mockServiceInstance.startTaskStreaming).toHaveBeenCalledWith(
        'task-1',
        'test-deployment',
        expect.any(Object)
      );
    });
  });

  it('should update task status on stream finish', async () => {
    const initialTask = createMockTask('task-1', 'running');
    (mockServiceInstance.getTasks as vi.Mock).mockReturnValue([initialTask]);
    
    let streamCallbacks: any;
    (mockServiceInstance.startTaskStreaming as vi.Mock).mockImplementation((_taskId, _deployment, callbacks) => {
      streamCallbacks = callbacks;
      return Promise.resolve();
    });

    const { result } = renderHook(() => useWorkflowTaskList(), { wrapper });

    await waitFor(() => {
      expect(result.current.tasks[0].status).toBe('running');
    });

    const finishedTask = { ...initialTask, status: 'complete' as const };
    act(() => {
      streamCallbacks.onFinish?.(finishedTask);
    });

    await waitFor(() => {
      expect(result.current.tasks[0].status).toBe('complete');
    });
  });

  it('should call createTask and refresh the list', async () => {
    const newTask = createMockTask('new-task');
    (mockServiceInstance.createTask as vi.Mock).mockResolvedValue(newTask);
    (mockServiceInstance.getTasks as vi.Mock).mockReturnValueOnce([]).mockReturnValueOnce([newTask]);

    const { result } = renderHook(() => useWorkflowTaskList(), { wrapper });
    
    await act(async () => {
      await result.current.createTask('test-deployment', {});
    });

    expect(mockServiceInstance.createTask).toHaveBeenCalledWith('test-deployment', {}, undefined);
    await waitFor(() => {
      expect(result.current.tasks).toEqual([newTask]);
      expect(mockServiceInstance.getTasks).toHaveBeenCalledTimes(2);
    });
  });

  it('should call clearCompletedTasks and refresh the list', async () => {
    (mockServiceInstance.getTasks as vi.Mock)
      .mockReturnValueOnce([createMockTask('task-1', 'complete')])
      .mockReturnValueOnce([]);

    const { result } = renderHook(() => useWorkflowTaskList(), { wrapper });
    
    await waitFor(() => {
        expect(result.current.tasks.length).toBe(1);
    });
      
    act(() => {
      result.current.clearCompleted();
    });

    expect(mockServiceInstance.clearCompletedTasks).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.tasks).toEqual([]);
    });
  });

  it('should stop streaming on unmount', async () => {
    const tasks = [createMockTask('task-1', 'running')];
    (mockServiceInstance.getTasks as vi.Mock).mockReturnValue(tasks);

    const { unmount } = renderHook(() => useWorkflowTaskList(), { wrapper });

    await waitFor(() => {
      expect(mockServiceInstance.startTaskStreaming).toHaveBeenCalledTimes(1);
    });

    unmount();
    
    expect(mockServiceInstance.stopTaskStreaming).toHaveBeenCalledWith('task-1');
  });
});