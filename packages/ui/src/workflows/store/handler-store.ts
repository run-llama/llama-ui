/**
 * Handler Store Implementation
 * Based on workflow-handler-suite.md specifications
 * Uses Zustand best practices with constructor pattern for client injection
 */

import { create } from "zustand";
import type { Client } from "@llamaindex/workflows-client";
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
  subscribe(
    handlerId: string,
    cfg?: {
      includeInternal?: boolean;
    }
  ): void;
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
        status: workflowHandler.status,
        workflowName: workflowHandler.workflowName,
      };

      // Internal method to set handler
      set((state) => ({
        handlers: { ...state.handlers, [handler.handler_id]: handler },
        events: { ...state.events, [handler.handler_id]: [] },
      }));
      // Don't auto-subscribe - let components decide if they want internal events or not
      // Components using useWorkflowHandler will subscribe with their preferred includeInternal setting
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

        // 3. Don't auto-subscribe here - let components decide if they want internal events or not
        // Auto-subscribing here causes duplicate subscriptions when RunDetailsPanel subscribes with includeInternal:true
      } catch (error) {
        // eslint-disable-next-line no-console -- needed for visibility and tests
        console.error("Failed to sync with server:", error);
        // Swallow error to fail gracefully
      }
    },

    // Stream subscription management
    subscribe: (handlerId: string, cfg?: { includeInternal?: boolean }) => {
      const handler = get().handlers[handlerId];
      if (!handler) {
        // eslint-disable-next-line no-console -- needed
        console.warn(`Handler ${handlerId} not found for subscription`);
        return;
      }

      // Use the same stream key logic as fetchHandlerEvents
      const streamKey = cfg?.includeInternal
        ? handlerStreamKey(handlerId, true)
        : handlerStreamKey(handlerId, false);

      // Check if already subscribed to prevent duplicate subscriptions
      if (workflowStreamingManager.isStreamActive(streamKey)) {
        return;
      }

      // Close any other stream for this handler (with different includeInternal setting)
      const otherStreamKey = cfg?.includeInternal
        ? handlerStreamKey(handlerId, false)
        : handlerStreamKey(handlerId, true);
      if (workflowStreamingManager.isStreamActive(otherStreamKey)) {
        workflowStreamingManager.closeStream(otherStreamKey);
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
      const { promise } = fetchHandlerEvents(
        {
          client,
          handlerId: handler.handler_id,
          includeInternal: cfg?.includeInternal ?? false,
        },
        callback
      );

      promise.catch((error) => {
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

      // Close both possible streams
      workflowStreamingManager.closeStream(handlerStreamKey(handlerId, false));
      workflowStreamingManager.closeStream(handlerStreamKey(handlerId, true));
    },

    isSubscribed: (handlerId: string): boolean => {
      const handler = get().handlers[handlerId];
      if (!handler) return false;
      // Check if either stream is active
      return (
        workflowStreamingManager.isStreamActive(
          handlerStreamKey(handlerId, false)
        ) ||
        workflowStreamingManager.isStreamActive(
          handlerStreamKey(handlerId, true)
        )
      );
    },
  }));

function handlerStreamKey(handlerId: string, includeInternal: boolean): string {
  return includeInternal
    ? `handler:${handlerId}:internal`
    : `handler:${handlerId}`;
}
