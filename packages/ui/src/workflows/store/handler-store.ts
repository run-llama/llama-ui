/**
 * Handler Store Implementation
 * Based on workflow-handler-suite.md specifications
 * Uses Zustand best practices with constructor pattern for client injection
 */

import { create } from "zustand";
import { Client } from "@llamaindex/workflows-client";
import { workflowStreamingManager } from "../../lib/shared-streaming";
import {
  createHandler as createHandlerAPI,
  fetchHandlerEvents,
  getRunningHandlers,
} from "./helper";
import type {
  WorkflowHandlerSummary,
  WorkflowEvent,
  StreamingEventCallback,
  JSONValue,
} from "../types";

export interface HandlerStoreState {
  // State
  handlers: Record<string, WorkflowHandlerSummary>;
  events: Record<string, WorkflowEvent[]>;

  // Basic operations
  clearCompleted(): void;
  createHandler(
    workflowName: string,
    input: JSONValue
  ): Promise<WorkflowHandlerSummary>;
  clearEvents(handlerId: string): void;

  // Server synchronization
  sync(): Promise<void>;

  // Stream subscription management
  subscribe(handlerId: string): void;
  unsubscribe(handlerId: string): void;
  isSubscribed(handlerId: string): boolean;
}

export const createHandlerStore = (client: Client) =>
  create<HandlerStoreState>()((set, get) => ({
    // Initial state
    handlers: {},
    events: {},

    // Basic operations
    clearCompleted: () =>
      set({
        handlers: Object.fromEntries(
          Object.entries(get().handlers).filter(
            ([, t]) => t.status !== "complete" && t.status !== "failed"
          )
        ),
      }),

    createHandler: async (workflowName: string, input: JSONValue) => {
      // Call API to create handler
      const workflowHandler = await createHandlerAPI({
        client,
        eventData: input,
        workflowName,
      });

      const handler: WorkflowHandlerSummary = {
        handler_id: workflowHandler.handler_id ?? "",
        status: "running",
        workflowName,
      };

      // Internal method to set handler
      set((state) => ({
        handlers: { ...state.handlers, [handler.handler_id]: handler },
        events: { ...state.events, [handler.handler_id]: [] },
      }));

      // Automatically subscribe to handler events after creation
      try {
        get().subscribe(handler.handler_id);
      } catch (error) {
        // eslint-disable-next-line no-console -- needed
        console.error(
          `Failed to auto-subscribe to handler ${handler.handler_id}:`,
          error
        );
        // Continue execution, subscription can be retried later
      }

      return handler;
    },

    clearEvents: (handlerId: string) =>
      set((state) => ({
        events: { ...state.events, [handlerId]: [] },
      })),

    // Server synchronization
    sync: async () => {
      try {
        // 1. Get running handlers from server
        const serverHandlers = await getRunningHandlers({
          client,
        });

        // 2. Update store with server handlers
        const newHandlersRecord = Object.fromEntries(
          serverHandlers.map((handler) => [handler.handler_id, handler])
        );
        set({ handlers: newHandlersRecord });

        // 3. Auto-subscribe to running handlers
        serverHandlers.forEach((handler) => {
          if (
            handler.status === "running" &&
            !get().isSubscribed(handler.handler_id)
          ) {
            get().subscribe(handler.handler_id);
          }
        });
      } catch (error) {
        // eslint-disable-next-line no-console -- needed for visibility and tests
        console.error("Failed to sync with server:", error);
        // Swallow error to fail gracefully
      }
    },

    // Stream subscription management
    subscribe: (handlerId: string) => {
      const handler = get().handlers[handlerId];
      if (!handler) {
        // eslint-disable-next-line no-console -- needed
        console.warn(`Handler ${handlerId} not found for subscription`);
        return;
      }

      // Check if already subscribed to prevent duplicate subscriptions
      if (get().isSubscribed(handlerId)) {
        return;
      }

      // Create streaming callback
      const callback: StreamingEventCallback = {
        onData: (event: WorkflowEvent) => {
          // Internal method to append event
          set((state) => ({
            events: {
              ...state.events,
              [handlerId]: [...(state.events[handlerId] || []), event],
            },
          }));
        },
        onFinish: () => {
          // Update handler status to complete
          set((state) => ({
            handlers: {
              ...state.handlers,
              [handlerId]: {
                ...state.handlers[handlerId],
                status: "complete",
                updatedAt: new Date(),
              },
            },
          }));
        },
        onError: (error: Error) => {
          // Ignore network errors caused by page refresh/unload
          if (
            error.name === "AbortError" ||
            (error.name === "TypeError" &&
              error.message.includes("network error"))
          ) {
            return;
          }
          // Update handler status to error
          set((state) => ({
            handlers: {
              ...state.handlers,
              [handlerId]: {
                ...state.handlers[handlerId],
                status: "failed",
                updatedAt: new Date(),
              },
            },
          }));
        },
      };

      // Use handler-based streaming
      fetchHandlerEvents(
        { client, handlerId: handler.handler_id },
        callback
      ).catch((error) => {
        // Ignore network errors caused by page refresh/unload
        if (
          error.name === "AbortError" ||
          (error.name === "TypeError" &&
            error.message.includes("network error"))
        ) {
          return;
        }
        // Update handler status to error
        set((state) => ({
          handlers: {
            ...state.handlers,
            [handlerId]: {
              ...state.handlers[handlerId],
              status: "failed",
              updatedAt: new Date(),
            },
          },
        }));
      });
    },

    unsubscribe: (handlerId: string) => {
      const handler = get().handlers[handlerId];
      if (!handler) return;

      const streamKey = `handler:${handlerId}`;
      workflowStreamingManager.closeStream(streamKey);
    },

    isSubscribed: (handlerId: string): boolean => {
      const handler = get().handlers[handlerId];
      if (!handler) return false;

      const streamKey = `handler:${handlerId}`;
      return workflowStreamingManager.isStreamActive(streamKey);
    },
  }));
