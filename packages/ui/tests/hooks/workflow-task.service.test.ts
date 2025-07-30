import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '@llamaindex/llama-deploy';
import { WorkflowTaskService } from '../../src/hooks/use-workflow-task/workflow-task.service';
import * as helperModule from '../../src/hooks/use-workflow-task/helper';
import * as storageModule from '../../src/hooks/use-workflow-task/storage';
import { WorkflowTask, WorkflowEvent, RunStatus } from '../../src/hooks/use-workflow/types';
import { ManagedWorkflowTask } from '../../src/hooks/use-workflow-task/types';

// Mock helper and storage modules
vi.mock('../../src/hooks/use-workflow-task/helper');
vi.mock('../../src/hooks/use-workflow-task/storage');

describe('WorkflowTaskService', () => {
  const createMockApiTask = (id: string): WorkflowTask => ({
    task_id: id,
    session_id: 'session-1',
    service_id: 'service-1',
    input: 'test-input',
  });
  
  const createMockManagedTask = (id: string, status: RunStatus = 'running'): ManagedWorkflowTask => ({
    task_id: id,
    session_id: 'session-1',
    service_id: 'service-1',
    input: 'test-input',
    deployment: 'test-deployment',
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    events: [],
  });
  
  const createMockEvent = (id: number): WorkflowEvent => ({
    type: `event-type-${id}`,
    data: { message: `event ${id}` },
  });

  // Setup function for creating service and mocks
  function setupTestEnvironment() {
    const mockClient = {} as Client;
    const service = new WorkflowTaskService(mockClient);
    return { service, mockClient };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storageModule.loadTasksFromStorage).mockReturnValue({ tasks: [] });
    vi.mocked(storageModule.saveTasksToStorage).mockImplementation(() => {});
    vi.mocked(storageModule.removeTaskFromStorage).mockImplementation(() => {});
    vi.mocked(storageModule.shouldRemoveFromStorage).mockImplementation((status) => 
      status === 'complete' || status === 'error'
    );
  });

  describe('CRUD Operations', () => {
    describe('createTask', () => {
      it('should create a new task successfully', async () => {
        const { service } = setupTestEnvironment();
        const mockTask = createMockApiTask('task-1');
        vi.mocked(helperModule.createTask).mockResolvedValue(mockTask);
        
        const result = await service.createTask('test-deployment', { test: 'data' });

        expect(helperModule.createTask).toHaveBeenCalledWith(expect.objectContaining({
          deploymentName: 'test-deployment',
        }));
        expect(result.task_id).toBe('task-1');
        expect(result.status).toBe('running');
        expect(service.getTasks().length).toBe(1);
        expect(storageModule.saveTasksToStorage).toHaveBeenCalled();
      });

    });

    describe('getTask', () => {
        it('should retrieve a task from memory if available', async () => {
            const { service } = setupTestEnvironment();
            const managedTask = createMockManagedTask('task-1');
            // @ts-expect-error -- accessing private member for test setup
            service.tasks.set('task-1', managedTask);
            
            const result = await service.getTask('task-1', 'test-deployment');

            expect(result?.task_id).toBe('task-1');
            expect(helperModule.getExistingTask).not.toHaveBeenCalled();
        });
    });

    describe('removeTask', () => {
        it('should remove a task from service', async () => {
            const { service } = setupTestEnvironment();
            const managedTask = createMockManagedTask('task-1');
            // @ts-expect-error -- accessing private member for test setup
            service.tasks.set('task-1', managedTask);
            
            service.removeTask('task-1');

            expect(service.getTasks().length).toBe(0);
            expect(storageModule.removeTaskFromStorage).toHaveBeenCalledWith('task-1');
        });
    });

    describe('clearCompletedTasks', () => {
        it('should clear only completed and error tasks', () => {
            const { service } = setupTestEnvironment();
            const runningTask = createMockManagedTask('task-1', 'running');
            const completedTask = createMockManagedTask('task-2', 'complete');
            const errorTask = createMockManagedTask('task-3', 'error');
            
            // @ts-expect-error -- accessing private member for test setup
            service.tasks.set(runningTask.task_id, runningTask);
            // @ts-expect-error -- accessing private member for test setup
            service.tasks.set(completedTask.task_id, completedTask);
            // @ts-expect-error -- accessing private member for test setup
            service.tasks.set(errorTask.task_id, errorTask);
            
            service.clearCompletedTasks();

            const remainingTasks = service.getTasks();
            expect(remainingTasks.length).toBe(1);
            expect(remainingTasks[0].task_id).toBe('task-1');
        });
    });
  });

  describe('Streaming Operations', () => {
    it('should start and stop streaming correctly', async () => {
        const { service } = setupTestEnvironment();
        const mockTask = createMockManagedTask('task-1');
        // @ts-expect-error -- accessing private member for test setup
        service.tasks.set('task-1', mockTask);
        vi.mocked(helperModule.fetchTaskEvents).mockResolvedValue([]);

        await service.startTaskStreaming('task-1', 'test-deployment');
        // @ts-expect-error -- accessing private member for test setup
        expect(service.streamingControllers.has('task-1')).toBe(true);

        service.stopTaskStreaming('task-1');
        // @ts-expect-error -- accessing private member for test setup
        expect(service.streamingControllers.has('task-1')).toBe(false);
    });

    it('should update task status on stream finish', async () => {
        const { service } = setupTestEnvironment();
        const mockTask = createMockManagedTask('task-1');
        // @ts-expect-error -- accessing private member for test setup
        service.tasks.set('task-1', mockTask);
        vi.mocked(helperModule.fetchTaskEvents).mockImplementation(async (_params, callback) => {
            callback?.onFinish?.([]);
            return [];
        });

        await service.startTaskStreaming('task-1', 'test-deployment');

        const task = service.getTasks().find(t => t.task_id === 'task-1');
        expect(task?.status).toBe('complete');
    });

    it('should handle streaming errors', async () => {
        const { service } = setupTestEnvironment();
        const mockTask = createMockManagedTask('task-1');
        // @ts-expect-error -- accessing private member for test setup
        service.tasks.set('task-1', mockTask);
        const streamError = new Error('Stream failed');
        vi.mocked(helperModule.fetchTaskEvents).mockImplementation(async (_params, callback) => {
            callback?.onError?.(streamError);
            return [];
        });

        await service.startTaskStreaming('task-1', 'test-deployment');

        const task = service.getTasks().find(t => t.task_id === 'task-1');
        expect(task?.status).toBe('error');
    });
  });

  describe('State Management', () => {
    it('should manage task events correctly', async () => {
      const { service } = setupTestEnvironment();
      const mockTask = createMockManagedTask('task-1');
      // @ts-expect-error -- accessing private member for test setup
      service.tasks.set('task-1', mockTask);

      vi.mocked(helperModule.fetchTaskEvents).mockImplementation(async (_params, callback) => {
          callback?.onData?.(createMockEvent(1));
          callback?.onData?.(createMockEvent(2));
          return [];
      });

      await service.startTaskStreaming('task-1', 'test-deployment');

      const events = service.getTaskEvents('task-1');
      expect(events).toHaveLength(2);
      expect(events[0].data).toEqual({ message: 'event 1' });

      service.clearTaskEvents('task-1');
      expect(service.getTaskEvents('task-1')).toHaveLength(0);
    });
  });
});

