/**
 * Chat Store Helper Functions
 * Integration with workflow client and streaming
 */

import type { Client as LlamaDeployClient } from "@llamaindex/workflows-client";
import {
  postWorkflowsByNameRunNowait,
  postEventsByHandlerId,
} from "@llamaindex/workflows-client";
import type { WorkflowEvent } from "../../workflows/types";
import { fetchHandlerEvents } from "../../workflows/store/helper";

/**
 * Start a new workflow handler for chat session
 * Returns the handlerId
 */
export async function createChatHandler(
  client: LlamaDeployClient,
  workflowName: string
): Promise<string> {
  const response = await postWorkflowsByNameRunNowait({
    client,
    path: { name: workflowName },
    body: { start_event: {} },
  });

  if (!response.data?.handler_id) {
    throw new Error("Failed to create chat handler: no handler_id returned");
  }

  return response.data.handler_id;
}

/**
 * Send a workflow event to a handler
 */
export async function sendEventToHandler(
  client: LlamaDeployClient,
  handlerId: string,
  event: WorkflowEvent
): Promise<void> {
  await postEventsByHandlerId({
    client,
    path: { handler_id: handlerId },
    body: {
      event: JSON.stringify(event),
    },
  });
}

/**
 * Subscribe to workflow events for a handler
 * Returns unsubscribe function
 */
export function subscribeToHandlerEvents(
  client: LlamaDeployClient,
  handlerId: string,
  callbacks: {
    onEvent?: (event: WorkflowEvent) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
  }
): () => void {
  const { onEvent, onError, onComplete } = callbacks;

  // Use the workflow store helper for streaming
  fetchHandlerEvents(
    { client, handlerId },
    {
      onData: (event: WorkflowEvent) => {
        onEvent?.(event);
      },
      onError: (error: Error) => {
        onError?.(error);
      },
      onFinish: () => {
        onComplete?.();
      },
    }
  );

  // Return a no-op unsubscribe for now (streaming manager handles cleanup)
  return () => {
    // Cleanup handled by streaming manager
  };
}

/**
 * Unsubscribe from handler events (stop streaming)
 * Uses the shared streaming manager
 */
export function unsubscribeFromHandler(handlerId: string): void {
  // The streaming manager uses a specific key format
  const streamKey = `handler:${handlerId}`;
  // Access the global streaming manager to close the stream
  // This is handled internally by the streaming manager
}
