/**
 * Workflow MSW Handlers - Factory Functions
 * Allows easy customization in individual stories
 * 
 * Uses real types from @llamaindex/workflows-client to ensure type safety
 */

import { http, HttpResponse, delay, type HttpHandler } from "msw";
import type { Handler, HandlersList } from "@llamaindex/workflows-client";

// Track created handlers for workflow mocks (using real Handler type)
const createdHandlers = new Map<string, Handler>();

// Track SSE controllers for each handler to enable pushing events from POST
const streamControllers = new Map<string, ReadableStreamDefaultController>();

// Track event generator per handler (story-specific)
const handlerConfigs = new Map<string, {
  eventGenerator: EventGenerator;
  eventDelay: number;
  initialDelay: number;
}>();

let taskCounter = 1;

/**
 * Event generator function type
 */
export type EventGenerator = (handlerId: string) => Array<{
  type: string;
  data: unknown;
}>;

/**
 * Helper to send events through SSE stream
 */
function sendEventsToStream(
  controller: ReadableStreamDefaultController,
  events: Array<{ type: string; data: unknown }>,
  delay: number
): void {
  let eventsSent = 0;
  
  const sendNextEvent = () => {
    if (eventsSent >= events.length) {
      return;
    }

    const event = events[eventsSent];
    const rawEvent = {
      __is_pydantic: true,
      value: event.data,
      qualified_name: event.type,
    };

    console.log(`MSW: Sending event ${eventsSent + 1}/${events.length}:`, rawEvent);
    
    // EventSource expects SSE format: "data: {...}\n\n"
    controller.enqueue(
      new TextEncoder().encode(`data: ${JSON.stringify(rawEvent)}\n\n`)
    );

    eventsSent++;
    setTimeout(sendNextEvent, delay);
  };

  sendNextEvent();
}

/**
 * Default workflow event generator
 */
export const defaultWorkflowEvents: EventGenerator = () => [
  {
    type: "AgentStream",
    data: { message: "Starting file analysis..." },
  },
  {
    type: "AgentStream",
    data: { message: "Processing uploaded file..." },
  },
  {
    type: "AgentStream",
    data: { message: "Analysis completed successfully!" },
  },
  {
    type: "workflow.events.StopEvent",
    data: { message: "Workflow completed successfully" },
  },
];

/**
 * Chat event generator for streaming chat responses
 */
export const chatEventGenerator: EventGenerator = (handlerId) => [
  {
    type: "workflow.events.ChatDeltaEvent",
    data: { delta: "Hello! " },
  },
  {
    type: "workflow.events.ChatDeltaEvent",
    data: { delta: "How can " },
  },
  {
    type: "workflow.events.ChatDeltaEvent",
    data: { delta: "I help you " },
  },
  {
    type: "workflow.events.ChatDeltaEvent",
    data: { delta: "today?" },
  },
  {
    type: "workflow.events.InputRequiredEvent",
    data: { prefix: "waiting" },
  },
];

/**
 * Options for creating workflow handlers
 */
export interface WorkflowHandlerOptions {
  /** Event generator function */
  eventGenerator?: EventGenerator;
  /** Delay between events (ms) */
  eventDelay?: number;
  /** Initial delay before first event (ms) */
  initialDelay?: number;
  /** Delay for run-nowait response (ms) */
  createDelay?: number;
  /** Custom handler ID generator */
  handlerIdGenerator?: () => string;
}

/**
 * Create workflow run-nowait handler
 */
export function createWorkflowRunHandler(
  options: WorkflowHandlerOptions = {}
): HttpHandler {
  const {
    createDelay = 300,
    handlerIdGenerator = () => `handler-${taskCounter++}`,
    eventGenerator = chatEventGenerator,
    eventDelay = 300,
    initialDelay = 500,
  } = options;

  return http.post("*/workflows/:workflow_name/run-nowait", async ({ params, request }) => {
    const { workflow_name } = params as { workflow_name: string };
    console.log("MSW: Intercepted workflow run-nowait request", {
      params,
      url: request.url,
    });

    await delay(createDelay);

    const handlerId = handlerIdGenerator();
    const now = new Date().toISOString();

    // Create Handler using real type from workflows-client
    const handler: Handler = {
      handler_id: handlerId,
      workflow_name,
      run_id: `run-${taskCounter}`,
      status: "running",
      started_at: now,
      updated_at: now,
      completed_at: null,
      error: null,
      result: undefined,
    };

    // Track the created handler
    createdHandlers.set(handlerId, handler);
    
    // Store config for this handler (for POST to use)
    handlerConfigs.set(handlerId, {
      eventGenerator,
      eventDelay,
      initialDelay,
    });

    console.log("MSW: Handler created with config:", {
      handlerId,
      hasEventGenerator: !!eventGenerator,
      eventGeneratorName: eventGenerator.name || 'anonymous',
      eventDelay,
      initialDelay
    });
    console.log("MSW: Returning workflow run-nowait response:", handler);
    return HttpResponse.json(handler);
  });
}

/**
 * Create workflow events streaming handler
 */
export function createWorkflowEventsHandler(
  options: WorkflowHandlerOptions = {}
): HttpHandler {
  const {
    eventGenerator = defaultWorkflowEvents,
    eventDelay = 1000,
    initialDelay = 500,
  } = options;

  return http.get("*/events/:handler_id", async (info) => {
    const { handler_id: handlerId } = info.params as { handler_id: string };
    console.log("MSW: Intercepted handler events request", {
      params: info.params,
      handlerId,
      url: info.request.url,
    });

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Store controller so POST can push events to this stream
        streamControllers.set(handlerId, controller);
        console.log(`MSW: SSE stream established for handler ${handlerId}, waiting for POST events`);
        
        // Stream stays open forever (chat workflow pattern)
        // POST requests will trigger events to be sent through this controller
      },
      cancel() {
        // Clean up when client closes connection
        streamControllers.delete(handlerId);
        console.log(`MSW: SSE stream closed for handler ${handlerId}`);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });
}

/**
 * Create handler for posting events to a handler
 */
export function createPostEventHandler(): HttpHandler {
  return http.post("*/events/:handler_id", async ({ params, request }) => {
    const { handler_id: handlerId } = params as { handler_id: string };
    console.log("MSW: Intercepted post event to handler:", handlerId);

    try {
      const body = await request.json();
      console.log("MSW: Received user event:", body);
      
      // Get the SSE controller for this handler
      const controller = streamControllers.get(handlerId);
      const config = handlerConfigs.get(handlerId);
      
      if (controller && config) {
        // Use handler-specific configuration
        const responseEvents = config.eventGenerator(handlerId);
        console.log(`MSW: Using config for ${handlerId}:`, {
          eventGeneratorName: config.eventGenerator.name || 'anonymous',
          eventCount: responseEvents.length,
          eventDelay: config.eventDelay,
          initialDelay: config.initialDelay,
          firstEventType: responseEvents[0]?.type
        });
        console.log(`MSW: Triggering ${responseEvents.length} response events for ${handlerId}`);
        
        setTimeout(() => {
          sendEventsToStream(controller, responseEvents, config.eventDelay);
        }, config.initialDelay);
      } else {
        if (!controller) console.warn(`MSW: No SSE stream found for handler ${handlerId}`);
        if (!config) console.warn(`MSW: No config found for handler ${handlerId}`);
      }
    } catch (error) {
      console.error("MSW: Error processing post event:", error);
    }

    await delay(200);

    return HttpResponse.json({ status: "sent" });
  });
}

/**
 * Create handler for getting workflow results
 */
export function createGetResultsHandler(): HttpHandler {
  return http.get("*/results/:handler_id", async ({ params }) => {
    const { handler_id: handlerId } = params as { handler_id: string };
    console.log("MSW: Intercepted get results request for:", handlerId);

    await delay(200);

    const handler = createdHandlers.get(handlerId);
    
    if (!handler) {
      return new HttpResponse("Handler not found", { status: 404 });
    }

    console.log("MSW: Returning handler result:", handler);
    return HttpResponse.json(handler);
  });
}

/**
 * Create handler for getting all handlers
 */
export function createGetHandlersHandler(): HttpHandler {
  return http.get("*/handlers", async () => {
    console.log("MSW: Intercepted get handlers request");

    const allHandlers = Array.from(createdHandlers.values());

    // If no handlers exist yet, add a default one for testing
    if (allHandlers.length === 0) {
      const now = new Date().toISOString();
      const defaultHandler: Handler = {
        handler_id: "handler-1",
        workflow_name: "default_workflow",
        run_id: "run-1",
        status: "running",
        started_at: now,
        updated_at: now,
        completed_at: null,
        error: null,
        result: undefined,
      };
      createdHandlers.set("handler-1", defaultHandler);
      allHandlers.push(defaultHandler);
    }

    // Return HandlersList type from workflows-client
    const response: HandlersList = {
      handlers: allHandlers,
    };

    console.log("MSW: Returning handlers list:", response);
    return HttpResponse.json(response);
  });
}

/**
 * Clear all handler state (useful when switching stories)
 */
export function resetWorkflowMocks(): void {
  createdHandlers.clear();
  streamControllers.clear();
  handlerConfigs.clear();
  console.log('MSW: Workflow mocks reset');
}

/**
 * Create a complete set of workflow handlers with custom options
 * Each story can create its own set of handlers with unique configuration
 */
export function createWorkflowHandlers(
  options: WorkflowHandlerOptions = {}
): HttpHandler[] {
  // Clear previous state when creating new handlers for a story
  resetWorkflowMocks();
  
  return [
    createWorkflowRunHandler(options),
    createWorkflowEventsHandler(options),
    createPostEventHandler(),
    createGetResultsHandler(),
    createGetHandlersHandler(),
  ];
}

/**
 * Default workflow handlers (for backward compatibility)
 */
export const defaultWorkflowHandlers = createWorkflowHandlers();
