/**
 * Test cases for WorkflowProgressBar component (C3)
 * Based on workflow-task-suite-test-cases.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowProgressBar } from '../../../src/workflow-task/components/workflow-progress-bar';
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

describe('WorkflowProgressBar', () => {
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

  describe('C3: Progress percentage and icon changes with status', () => {
    it('should show correct progress and running icon for running status', () => {
      const completeTask = createMockTask('task-1', 'complete');
      const runningTask = createMockTask('task-2', 'running');
      
      // Setup store: 1 complete + 1 running = 50% progress, running status
      useTaskStore.setState({
        tasks: {
          [completeTask.task_id]: completeTask,
          [runningTask.task_id]: runningTask,
        },
        events: {},
      });

      render(<WorkflowProgressBar />);

      // Check progress percentage (1 out of 2 complete = 50%)
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '2');
      
      // Check for running/processing icon (could be a spinner or clock icon)
      const statusIcon = screen.getByTestId('status-icon');
      expect(statusIcon).toHaveClass('status-running');
    });

    it('should show correct progress and complete icon for complete status', () => {
      const completeTask1 = createMockTask('task-1', 'complete');
      const completeTask2 = createMockTask('task-2', 'complete');
      
      // Setup store: 2 complete + 0 running = 100% progress, complete status
      useTaskStore.setState({
        tasks: {
          [completeTask1.task_id]: completeTask1,
          [completeTask2.task_id]: completeTask2,
        },
        events: {},
      });

      render(<WorkflowProgressBar />);

      // Check progress percentage (2 out of 2 complete = 100%)
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '2');
      expect(progressBar).toHaveAttribute('aria-valuemax', '2');
      
      // Check for complete/success icon (could be checkmark)
      const statusIcon = screen.getByTestId('status-icon');
      expect(statusIcon).toHaveClass('status-complete');
    });

    it('should show correct progress and error icon for error status', () => {
      const completeTask = createMockTask('task-1', 'complete');
      const errorTask = createMockTask('task-2', 'error');
      const runningTask = createMockTask('task-3', 'running');
      
      // Setup store: 1 complete + 1 error + 1 running = 33% progress, error status
      useTaskStore.setState({
        tasks: {
          [completeTask.task_id]: completeTask,
          [errorTask.task_id]: errorTask,
          [runningTask.task_id]: runningTask,
        },
        events: {},
      });

      render(<WorkflowProgressBar />);

      // Check progress percentage (1 out of 3 complete = 33%)
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '3');
      
      // Check for error/failed icon (could be X or warning icon)
      const statusIcon = screen.getByTestId('status-icon');
      expect(statusIcon).toHaveClass('status-error');
    });

    it('should show idle state when no tasks', () => {
      render(<WorkflowProgressBar />);

      // Check progress percentage (0 out of 0 = 0%)
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '0');
      
      // Check for idle status
      const statusIcon = screen.getByTestId('status-icon');
      expect(statusIcon).toHaveClass('status-idle');
    });

    it('should display progress text correctly', () => {
      const completeTask = createMockTask('task-1', 'complete');
      const runningTask = createMockTask('task-2', 'running');
      
      useTaskStore.setState({
        tasks: {
          [completeTask.task_id]: completeTask,
          [runningTask.task_id]: runningTask,
        },
        events: {},
      });

      render(<WorkflowProgressBar />);

      // Should show "1 of 2" or "1/2" progress text
      expect(screen.getByText(/1.*2/)).toBeInTheDocument();
    });
  });
});