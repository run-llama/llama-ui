/**
 * Task Store Implementation
 * Based on workflow-task-suite.md specifications
 * Uses Zustand best practices with constructor pattern for client injection
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient, createConfig, Client } from '@llamaindex/llama-deploy';
import { workflowStreamingManager } from '../../lib/shared-streaming';
import { createTask as createTaskAPI, fetchTaskEvents } from './helper';
import type { WorkflowTaskSummary, WorkflowEvent, StreamingEventCallback } from '../types';

interface TaskStoreState {
  // State
  tasks: Record<string, WorkflowTaskSummary>;
  events: Record<string, WorkflowEvent[]>;
  
  // Basic operations
  clearCompleted(): void;
  createTask(deployment: string, input: string, workflow?: string): Promise<WorkflowTaskSummary>;
  clearEvents(taskId: string): void;
  
  // Stream subscription management
  subscribe(taskId: string, deployment: string): void;
  unsubscribe(taskId: string): void;
  isSubscribed(taskId: string): boolean;
}

const createTaskStore = (client: Client) => create<TaskStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: {},
      events: {},

      // Basic operations
      clearCompleted: () =>
        set({
          tasks: Object.fromEntries(
            Object.entries(get().tasks).filter(
              ([, t]) => t.status !== 'complete' && t.status !== 'error'
            )
          ),
        }),

      createTask: async (deployment: string, input: string, workflow?: string) => {
        try {
          // Call API to create task
          const workflowTask = await createTaskAPI({
            client,
            deploymentName: deployment,
            eventData: input,
            workflow
          });

        
          // Convert to WorkflowTaskSummary and store
          const task: WorkflowTaskSummary = {
            task_id: workflowTask.task_id,
            session_id: workflowTask.session_id,
            service_id: workflowTask.service_id,
            input: workflowTask.input,
            deployment,
            status: 'running',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // Internal method to set task
          set(state => ({
            tasks: { ...state.tasks, [task.task_id]: task },
            events: { ...state.events, [task.task_id]: [] }
          }));

          // Automatically subscribe to task events after creation
          try {
            get().subscribe(task.task_id, deployment);
          } catch (error) {
            console.error(`Failed to auto-subscribe to task ${task.task_id}:`, error);
            // Continue execution, subscription can be retried later
          }
          
          return task;
        } catch (error) {
          console.error('Failed to create task:', error);
          throw error;
        }
      },

      clearEvents: (taskId: string) =>
        set(state => ({ 
          events: { ...state.events, [taskId]: [] } 
        })),

      // Stream subscription management
      subscribe: (taskId: string, deployment: string) => {
        const task = get().tasks[taskId];
        if (!task) {
          console.warn(`Task ${taskId} not found for subscription`);
          return;
        }

        // Check if already subscribed to prevent duplicate subscriptions
        if (get().isSubscribed(taskId)) {
          return;
        }

        // Create streaming callback
        const callback: StreamingEventCallback = {
          onData: (event: WorkflowEvent) => {
            // Internal method to append event
            set(state => ({
              events: {
                ...state.events,
                [taskId]: [...(state.events[taskId] || []), event]
              }
            }));
          },
          onFinish: () => {
            // Update task status to complete
            set(state => ({
              tasks: {
                ...state.tasks,
                [taskId]: { 
                  ...state.tasks[taskId], 
                  status: 'complete', 
                  updatedAt: new Date() 
                }
              }
            }));
          },
          onError: (error: Error) => {
            console.error(`Streaming error for task ${taskId}:`, error);
            // Update task status to error
            set(state => ({
              tasks: {
                ...state.tasks,
                [taskId]: { 
                  ...state.tasks[taskId], 
                  status: 'error', 
                  updatedAt: new Date() 
                }
              }
            }));
          }
        };

        // Use fetchTaskEvents directly - it already handles SharedStreamingManager internally
        fetchTaskEvents({
          client,
          deploymentName: deployment,
          task: {
            task_id: task.task_id,
            session_id: task.session_id,
            service_id: task.service_id,
            input: task.input
          }
        }, callback).catch(error => {
          console.error(`Failed to start task events streaming for ${taskId}:`, error);
          // Update task status to error
          set(state => ({
            tasks: {
              ...state.tasks,
              [taskId]: { 
                ...state.tasks[taskId], 
                status: 'error', 
                updatedAt: new Date() 
              }
            }
          }));
        });
      },

      unsubscribe: (taskId: string) => {
        const task = get().tasks[taskId];
        if (!task) return;

        const streamKey = `task:${taskId}:${task.deployment}`;
        workflowStreamingManager.closeStream(streamKey);
      },

      isSubscribed: (taskId: string): boolean => {
        const task = get().tasks[taskId];
        if (!task) return false;

        const streamKey = `task:${taskId}:${task.deployment}`;
        return workflowStreamingManager.isStreamActive(streamKey);
      },
    }),
    {
      name: 'llama-task', // localStorage key
      partialize: (state) => {
        // Only persist incomplete tasks (not completed or error)
        // Completed tasks remain in memory but are not persisted
        const incompleteTasks = Object.fromEntries(
          Object.entries(state.tasks).filter(
            ([, task]) => task.status !== 'complete' && task.status !== 'error'
          )
        );
        
        return {
          tasks: incompleteTasks,
          events: {}, // Don't persist events
        };
      },
    }
  )
);

const client = createClient(createConfig({ baseUrl: process.env.LLAMA_DEPLOY_BASE_URL || 'http://localhost:8000' }));

export const useTaskStore = createTaskStore(client);