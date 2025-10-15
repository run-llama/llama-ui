/**
 * Handler Store Implementation
 * Based on workflow-handler-suite.md specifications
 * Uses Zustand best practices with constructor pattern for client injection
 */

import { create } from "zustand";
import {
  getHandlers,
  postWorkflowsByNameRunNowait,
  type Client,
} from "@llamaindex/workflows-client";
import type { JSONValue } from "../types";
import { Handler } from "./handler";

export interface HandlerStoreState {
  // State
  handlers: Record<string, Handler>;

  createHandler(workflowName: string, input: JSONValue): Promise<Handler>;

  fetchRunningHandlers(): Promise<Handler[]>;
}

export const createHandlerStore = (client: Client) =>
  create<HandlerStoreState>()((set) => ({
    // Initial state
    handlers: {},

    // TODO: after workflow-py remove completed handlers from memory, this needs to be updated to fetch all handlers
    fetchRunningHandlers: async () => {
      const resp = await getHandlers({
        client,
      });
      const allHandlers = resp.data?.handlers ?? [];

      const runningHandlers = allHandlers
        .filter((handler) => handler.status === "running")
        .map((handler) => new Handler(handler, client));

      set((state) => ({
        handlers: {
          ...state.handlers,
          ...Object.fromEntries(runningHandlers.map((h) => [h.handlerId, h])),
        },
      }));

      return runningHandlers;
    },

    createHandler: async (workflowName: string, input: JSONValue) => {
      const data = await postWorkflowsByNameRunNowait({
        client,
        path: { name: workflowName },
        body: {
          start_event: input as { [key: string]: unknown } | undefined,
        },
      });

      if (!data.data) {
        throw new Error("Handler creation failed");
      }

      const handler = new Handler(data.data, client);

      // Internal method to set handler
      set((state) => ({
        handlers: { ...state.handlers, [handler.handlerId]: handler },
      }));
      return handler;
    },
  }));
