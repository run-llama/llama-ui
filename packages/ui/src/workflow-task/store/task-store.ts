/**
 * Task Store Implementation
 * Based on workflow-task-suite.md specifications
 * Uses Zustand best practices with constructor pattern for client injection
 */

import { create } from "zustand";
import { Client } from "@llamaindex/workflows-client";
import { workflowStreamingManager } from "../../lib/shared-streaming";
import {
  createTask as createTaskAPI,
  fetchHandlerEvents,
  getRunningHandlers,
} from "./helper";
import type {
  WorkflowHandlerSummary,
  WorkflowEvent,
  StreamingEventCallback,
  JSONValue,
} from "../types";
import { ReconnectManager, type TaskStatus } from "./reconnect-manager";

export interface TaskStoreState {
  // State
  tasks: Record<string, WorkflowHandlerSummary>;
  events: Record<string, WorkflowEvent[]>;

  // Basic operations
  clearCompleted(): void;
  createTask(
    workflowName: string,
    input: JSONValue
  ): Promise<WorkflowHandlerSummary>;
  clearEvents(taskId: string): void;

  // Server synchronization
  sync(): Promise<void>;

  // Stream subscription management
  subscribe(taskId: string): void;
  unsubscribe(taskId: string): void;
  isSubscribed(taskId: string): boolean;
}

export const createTaskStore = (client: Client) =>
  create<TaskStoreState>()((set, get) => {
    // Scheduler backed by setTimeout/clearTimeout
    const scheduler = {
      schedule: (fn: () => void, delayMs: number) => {
        const id = setTimeout(fn, delayMs);
        return { id };
      },
      cancel: (handle: { id: ReturnType<typeof setTimeout> } | null | undefined) => {
        if (!handle) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clearTimeout(handle.id as any);
      },
    } as const;

    const getNarrowTaskStatus = (taskId: string): TaskStatus => {
      const status = get().tasks[taskId]?.status;
      if (status === "running" || status === "complete" || status === "failed") {
        return status;
      }
      return undefined;
    };

    const reconnectManager = new ReconnectManager({
      scheduler,
      getTaskStatus: getNarrowTaskStatus,
      isSubscribed: (taskId: string) => get().isSubscribed(taskId),
      onSubscribe: (taskId: string) => {
        // Avoid tight loops; schedule synchronously to reuse store entry point
        get().subscribe(taskId);
      },
      baseMs: 500,
      maxMs: 30000,
    });

    return {
      // Initial state
      tasks: {},
      events: {},

      // Basic operations
      clearCompleted: () =>
        set({
          tasks: Object.fromEntries(
            Object.entries(get().tasks).filter(
              ([, t]) => t.status !== "complete" && t.status !== "failed"
            )
          ),
        }),

      createTask: async (workflowName: string, input: JSONValue) => {
        // Call API to create task
        const workflowHandler = await createTaskAPI({
          client,
          eventData: input,
          workflowName,
        });

        const task: WorkflowHandlerSummary = {
          handler_id: workflowHandler.handler_id ?? "",
          status: "running",
        };

        // Internal method to set task
        set((state) => ({
          tasks: { ...state.tasks, [task.handler_id]: task },
          events: { ...state.events, [task.handler_id]: [] },
        }));

        // Automatically subscribe to task events after creation
        try {
          get().subscribe(task.handler_id);
        } catch (error) {
          // eslint-disable-next-line no-console -- needed
          console.error(
            `Failed to auto-subscribe to task ${task.handler_id}:`,
            error
          );
          // Continue execution, subscription can be retried later
        }

        return task;
      },

      clearEvents: (taskId: string) =>
        set((state) => ({
          events: { ...state.events, [taskId]: [] },
        })),

      // Server synchronization
      sync: async () => {
        try {
          // 1. Get running tasks from server
          const serverTasks = await getRunningHandlers({
            client,
          });

          // 2. Update store with server tasks
          const newTasksRecord = Object.fromEntries(
            serverTasks.map((task) => [task.handler_id, task])
          );
          set({ tasks: newTasksRecord });

          // 3. Auto-subscribe to running tasks
          serverTasks.forEach((task) => {
            if (!get().isSubscribed(task.handler_id)) {
              get().subscribe(task.handler_id);
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console -- needed for visibility and tests
          console.error("Failed to sync with server:", error);
          // Swallow error to fail gracefully
        }
      },

      // Stream subscription management
      subscribe: (taskId: string) => {
        const task = get().tasks[taskId];
        if (!task) {
          // eslint-disable-next-line no-console -- needed
          console.warn(`Task ${taskId} not found for subscription`);
          return;
        }

        // Check if already subscribed to prevent duplicate subscriptions
        if (get().isSubscribed(taskId)) {
          return;
        }

        // Clear any pending reconnect attempts when (re)subscribing
        reconnectManager.clear(taskId);

        // Create streaming callback
        const callback: StreamingEventCallback = {
          onStart: () => reconnectManager.handleStreamStart(taskId),
          onData: (event: WorkflowEvent) => {
            // Internal method to append event
            set((state) => ({
              events: {
                ...state.events,
                [taskId]: [...(state.events[taskId] || []), event],
              },
            }));
          },
          onFinish: () => {
            // Clear any pending reconnect attempts
            reconnectManager.handleStreamFinish(taskId);
            // Update task status to complete
            set((state) => ({
              tasks: {
                ...state.tasks,
                [taskId]: {
                  ...state.tasks[taskId],
                  status: "complete",
                  updatedAt: new Date(),
                },
              },
            }));
          },
          onError: (error: Error) => {
            const scheduled = reconnectManager.handleStreamError(taskId, error);
            if (scheduled) return;
            // If not scheduled (not running or ignorable), and not running anymore, mark as failed
            const currentTask = get().tasks[taskId];
            if (!currentTask || currentTask.status !== "running") {
              set((state) => ({
                tasks: {
                  ...state.tasks,
                  [taskId]: {
                    ...state.tasks[taskId],
                    status: "failed",
                    updatedAt: new Date(),
                  },
                },
              }));
            }
          },
        };

        // Use handler-based streaming
        fetchHandlerEvents(
          { client, handlerId: task.handler_id },
          callback
        ).catch((error) => {
          const scheduled = reconnectManager.handleStreamError(taskId, error);
          if (scheduled) return;
          const currentTask = get().tasks[taskId];
          if (!currentTask || currentTask.status !== "running") {
            set((state) => ({
              tasks: {
                ...state.tasks,
                [taskId]: {
                  ...state.tasks[taskId],
                  status: "failed",
                  updatedAt: new Date(),
                },
              },
            }));
          }
        });
      },

      unsubscribe: (taskId: string) => {
        const task = get().tasks[taskId];
        if (!task) return;

        const streamKey = `handler:${taskId}`;
        workflowStreamingManager.closeStream(streamKey);
        // Clear any scheduled reconnect
        reconnectManager.clear(taskId);
      },

      isSubscribed: (taskId: string): boolean => {
        const task = get().tasks[taskId];
        if (!task) return false;

        const streamKey = `handler:${taskId}`;
        return workflowStreamingManager.isStreamActive(streamKey);
      },
    };
  });
