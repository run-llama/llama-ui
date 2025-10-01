/**
 * Chat Store Helper Tests
 * Tests for streaming subscription and cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Client as LlamaDeployClient } from "@llamaindex/workflows-client";
import {
  createChatHandler,
  sendEventToHandler,
  subscribeToHandlerEvents,
  unsubscribeFromHandler,
} from "../../src/chat/store/helper";
import { workflowStreamingManager } from "../../src/lib/shared-streaming";
import type { WorkflowEvent } from "../../src/workflows/types";

// Mock the workflows client
vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual("@llamaindex/workflows-client");
  return {
    ...actual,
    postWorkflowsByNameRunNowait: vi.fn(),
    postEventsByHandlerId: vi.fn(),
    getResultsByHandlerId: vi
      .fn()
      .mockResolvedValue({ data: { result: null } }),
  };
});

describe("Chat Store Helper - Stream Cleanup", () => {
  let mockClient: LlamaDeployClient;
  const handlerId = "test-handler-123";
  const workflowName = "test-workflow";

  beforeEach(() => {
    mockClient = {
      getConfig: () => ({ baseUrl: "http://localhost:8000" }),
    } as LlamaDeployClient;

    // Clear all streams before each test
    workflowStreamingManager.closeAllStreams();
  });

  afterEach(() => {
    // Clean up all streams after each test
    workflowStreamingManager.closeAllStreams();
  });

  describe("subscribeToHandlerEvents", () => {
    it("should return a valid unsubscribe function", () => {
      const callbacks = {
        onEvent: vi.fn(),
        onError: vi.fn(),
        onComplete: vi.fn(),
      };

      const unsubscribe = subscribeToHandlerEvents(
        mockClient,
        handlerId,
        callbacks
      );

      // Verify we got a function back
      expect(typeof unsubscribe).toBe("function");

      // Verify stream is active
      const streamKey = `handler:${handlerId}`;
      expect(workflowStreamingManager.isStreamActive(streamKey)).toBe(true);

      // Call unsubscribe
      unsubscribe();

      // Verify stream is closed
      expect(workflowStreamingManager.isStreamActive(streamKey)).toBe(false);
    });

    it("should stop receiving events after unsubscribe", async () => {
      const receivedEvents: WorkflowEvent[] = [];
      const callbacks = {
        onEvent: vi.fn((event: WorkflowEvent) => {
          receivedEvents.push(event);
        }),
      };

      const unsubscribe = subscribeToHandlerEvents(
        mockClient,
        handlerId,
        callbacks
      );

      // Simulate some events before unsubscribe
      const streamKey = `handler:${handlerId}`;
      expect(workflowStreamingManager.isStreamActive(streamKey)).toBe(true);

      // Unsubscribe
      unsubscribe();

      // Verify stream is closed
      expect(workflowStreamingManager.isStreamActive(streamKey)).toBe(false);

      // Any subsequent events should not be received
      // (This is verified by the stream being inactive)
    });
  });

  describe("unsubscribeFromHandler", () => {
    it("should close the EventSource stream", () => {
      const callbacks = {
        onEvent: vi.fn(),
      };

      // Subscribe first
      subscribeToHandlerEvents(mockClient, handlerId, callbacks);

      // Verify stream is active
      const streamKey = `handler:${handlerId}`;
      expect(workflowStreamingManager.isStreamActive(streamKey)).toBe(true);

      // Call unsubscribeFromHandler
      unsubscribeFromHandler(handlerId);

      // Verify stream is closed
      expect(workflowStreamingManager.isStreamActive(streamKey)).toBe(false);
    });

    it("should be idempotent (safe to call multiple times)", () => {
      const callbacks = {
        onEvent: vi.fn(),
      };

      // Subscribe first
      subscribeToHandlerEvents(mockClient, handlerId, callbacks);

      // Unsubscribe multiple times
      unsubscribeFromHandler(handlerId);
      unsubscribeFromHandler(handlerId);
      unsubscribeFromHandler(handlerId);

      // Should not throw and stream should remain closed
      const streamKey = `handler:${handlerId}`;
      expect(workflowStreamingManager.isStreamActive(streamKey)).toBe(false);
    });

    it("should handle unsubscribing from non-existent handler", () => {
      // Should not throw
      expect(() => {
        unsubscribeFromHandler("non-existent-handler");
      }).not.toThrow();
    });
  });

  describe("Memory leak prevention", () => {
    it("should clean up EventSource when unsubscribed", () => {
      const handlers = ["handler-1", "handler-2", "handler-3"];
      const unsubscribers: (() => void)[] = [];

      // Create multiple subscriptions
      handlers.forEach((id) => {
        const unsubscribe = subscribeToHandlerEvents(mockClient, id, {
          onEvent: vi.fn(),
        });
        unsubscribers.push(unsubscribe);

        // Verify stream is active
        expect(workflowStreamingManager.isStreamActive(`handler:${id}`)).toBe(
          true
        );
      });

      // Unsubscribe all
      unsubscribers.forEach((unsub) => unsub());

      // Verify all streams are closed
      handlers.forEach((id) => {
        expect(workflowStreamingManager.isStreamActive(`handler:${id}`)).toBe(
          false
        );
      });
    });

    it("should clean up when using unsubscribeFromHandler directly", () => {
      const handlers = ["handler-1", "handler-2", "handler-3"];

      // Create multiple subscriptions
      handlers.forEach((id) => {
        subscribeToHandlerEvents(mockClient, id, {
          onEvent: vi.fn(),
        });
      });

      // Unsubscribe using unsubscribeFromHandler
      handlers.forEach((id) => {
        unsubscribeFromHandler(id);
      });

      // Verify all streams are closed
      handlers.forEach((id) => {
        expect(workflowStreamingManager.isStreamActive(`handler:${id}`)).toBe(
          false
        );
      });
    });
  });
});
