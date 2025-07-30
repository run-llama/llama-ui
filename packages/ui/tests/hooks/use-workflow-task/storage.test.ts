import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  convertManagedToStored,
  filterTaskFromStored,
  loadTasksFromStorage,
  removeTaskFromStorage,
  saveTasksToStorage,
  shouldRemoveFromStorage,
} from '../../../src/hooks/use-workflow-task/storage';
import { ManagedWorkflowTask, StoredTaskData } from '../../../src/hooks/use-workflow-task/types';
import { RunStatus } from '../../../src/hooks/use-workflow/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('storage utilities', () => {
  const STORAGE_KEY = 'llama-ui-workflow-tasks';

  beforeEach(() => {
    localStorageMock.clear();
  });

  const createMockManagedTask = (
    id: string,
    status: RunStatus = 'running'
  ): ManagedWorkflowTask => ({
    task_id: id,
    session_id: 'session-1',
    service_id: 'service-1',
    input: 'test input',
    deployment: 'production',
    status,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z'),
    events: [],
  });

  describe('saveTasksToStorage', () => {
    it('should save tasks to localStorage', () => {
      const storedData: StoredTaskData = {
        tasks: [
          { task_id: 'task-1', deployment: 'test', status: 'running', createdAt: new Date().toISOString() },
        ],
      };
      saveTasksToStorage(storedData);
      const saved = localStorageMock.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!)).toEqual(storedData);
    });

    it('should handle empty tasks array', () => {
      const storedData: StoredTaskData = { tasks: [] };
      saveTasksToStorage(storedData);
      const saved = localStorageMock.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!)).toEqual({ tasks: [] });
    });
  });

  describe('loadTasksFromStorage', () => {
    it('should load tasks from localStorage', () => {
      const storedData = {
        tasks: [
          { task_id: 'task-1', deployment: 'test', status: 'running', createdAt: new Date().toISOString() },
        ],
      };
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(storedData));
      const loaded = loadTasksFromStorage();
      expect(loaded).toEqual(storedData);
    });

    it('should return empty array if no data in localStorage', () => {
      const loaded = loadTasksFromStorage();
      expect(loaded).toEqual({ tasks: [] });
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.setItem(STORAGE_KEY, 'invalid-json');
      const loaded = loadTasksFromStorage();
      expect(loaded).toEqual({ tasks: [] });
    });
  });

  describe('convertManagedToStored', () => {
    it('should convert managed tasks to minimal stored format', () => {
      const managedTasks: ManagedWorkflowTask[] = [
        createMockManagedTask('task-1', 'complete'),
      ];
      const result = convertManagedToStored(managedTasks);
      
      expect(result).toEqual({
        tasks: [{
          task_id: 'task-1',
          deployment: 'production',
          status: 'complete',
          createdAt: '2023-01-01T10:00:00.000Z',
        }],
      });
    });

    it('should not include running tasks if configured to skip', () => {
        const managedTasks: ManagedWorkflowTask[] = [
            createMockManagedTask('task-1', 'running'),
            createMockManagedTask('task-2', 'complete'),
        ];
        // Example of a potential configuration to skip 'running' tasks
        const result = convertManagedToStored(managedTasks.filter(t => t.status !== 'running'));
        expect(result.tasks.length).toBe(1);
        expect(result.tasks[0].task_id).toBe('task-2');
    });
  });

  describe('removeTaskFromStorage', () => {
    it('should remove a specific task from storage', () => {
      const storedData = {
        tasks: [
          { task_id: 'task-1', deployment: 'test', status: 'complete', createdAt: new Date().toISOString() },
          { task_id: 'task-2', deployment: 'test', status: 'complete', createdAt: new Date().toISOString() },
        ],
      };
      saveTasksToStorage(storedData);
      removeTaskFromStorage('task-1');
      const loaded = loadTasksFromStorage();
      expect(loaded.tasks.length).toBe(1);
      expect(loaded.tasks[0].task_id).toBe('task-2');
    });
  });

  describe('filterTaskFromStored', () => {
    it('should filter out a task by ID', () => {
        const storedData = {
            tasks: [
              { task_id: 'task-1', deployment: 'test', status: 'complete', createdAt: new Date().toISOString() },
              { task_id: 'task-2', deployment: 'test', status: 'complete', createdAt: new Date().toISOString() },
            ],
          };
        const result = filterTaskFromStored(storedData, 'task-1');
        expect(result.tasks.length).toBe(1);
        expect(result.tasks[0].task_id).toBe('task-2');
    });
  });

  describe('shouldRemoveFromStorage', () => {
    it('should return true for "complete" status', () => {
      expect(shouldRemoveFromStorage('complete')).toBe(true);
    });

    it('should return true for "error" status', () => {
      expect(shouldRemoveFromStorage('error')).toBe(true);
    });

    it('should return false for "running" status', () => {
      expect(shouldRemoveFromStorage('running')).toBe(false);
    });
  });
}); 