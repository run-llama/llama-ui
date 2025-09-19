import {
  Client,
  postWorkflowsByNameRunNowait,
  getHandlers,
  postEventsByHandlerId,
  getEventsByHandlerId,
} from "@llamaindex/workflows-client";
import {
  RawEvent,
  StreamingEventCallback,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowHandlerSummary,
  RunStatus,
} from "../types";
import {
  workflowStreamingManager,
  type StreamSubscriber,
} from "../../lib/shared-streaming";

export async function getRunningHandlers(params: {
  client: Client;
}): Promise<WorkflowHandlerSummary[]> {
  const resp = await getHandlers({
    client: params.client,
  });
  const allHandlers = resp.data?.handlers ?? [];

  return allHandlers
    .filter((handler) => handler.status === "running")
    .map((handler) => ({
      handler_id: handler.handler_id ?? "",
      status: handler.status as RunStatus,
    }));
}

export async function getExistingHandler(params: {
  client: Client;
  handlerId: string;
}): Promise<WorkflowHandlerSummary> {
  const resp = await getHandlers({
    client: params.client,
  });
  const allHandlers = resp.data?.handlers ?? [];
  const handler = allHandlers.find((h) => h.handler_id === params.handlerId);

  if (!handler) {
    throw new Error(`Handler ${params.handlerId} not found`);
  }

  return {
    handler_id: handler.handler_id ?? "",
    status: (handler.status as RunStatus) ?? "running",
  };
}

export async function createHandler<E extends WorkflowEvent>(params: {
  client: Client;
  workflowName: string;
  eventData: E["data"];
}): Promise<WorkflowHandlerSummary> {
  const data = await postWorkflowsByNameRunNowait({
    client: params.client,
    path: { name: params.workflowName },
    body: {
      start_event: params.eventData as { [key: string]: unknown } | undefined,
    },
  });

  if (!data.data) {
    throw new Error("Handler creation failed");
  }

  return {
    handler_id: data.data.handler_id ?? "",
    status: "running",
    workflowName: params.workflowName,
  };
}

export async function fetchHandlerEvents<E extends WorkflowEvent>(
  params: {
    client: Client;
    handlerId: string;
    signal?: AbortSignal;
  },
  callback?: StreamingEventCallback<E>
): Promise<E[]> {
  const streamKey = `handler:${params.handlerId}`;

  // Create executor function that implements the actual streaming logic
  const executor = async (
    subscriber: StreamSubscriber<E>,
    signal: AbortSignal
  ): Promise<E[]> => {
    const resp = await getEventsByHandlerId({
      client: params.client,
      path: { handler_id: params.handlerId },
      // NDJSON stream
      query: { sse: false },
      // Ensure we get a ReadableStream without auto-parsing
      parseAs: "stream",
    });
    const response = resp.response;

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      throw error;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No reader available");
    }

    const decoder = new TextDecoder();
    const accumulatedEvents: E[] = [];
    let retryParsedLines: string[] = [];

    try {
      while (true) {
        if (signal.aborted) {
          throw new Error("Stream aborted");
        }

        const { done, value } = await reader.read();
        if (done) break;

        let chunk = decoder.decode(value, { stream: true });

        if (retryParsedLines.length > 0) {
          // if there are lines that failed to parse, append them to the current chunk
          chunk = `${retryParsedLines.join("")}${chunk}`;
          retryParsedLines = []; // reset for next iteration
        }

        const { events, failedLines } = toWorkflowEvents<E>(chunk);
        retryParsedLines.push(...failedLines);

        if (!events.length) continue;

        accumulatedEvents.push(...events);

        // Send events to SharedStreamingManager subscriber
        events.forEach((event) => subscriber.onData?.(event));

        const stopEvent = events.find(
          (event) => event.type === WorkflowEventType.StopEvent.toString()
        );
        if (stopEvent) {
          // For compatibility with existing callback interface
          if (callback?.onStopEvent) {
            callback.onStopEvent(stopEvent);
          }
          break; // Stop event received, end the stream
        }
      }

      // Notify completion
      subscriber.onFinish?.(accumulatedEvents);

      return accumulatedEvents;
    } finally {
      reader.releaseLock();
    }
  };

  // Convert callback to SharedStreamingManager subscriber
  const subscriber: StreamSubscriber<E> = {
    onStart: callback?.onStart,
    onData: callback?.onData,
    onError: callback?.onError,
    onFinish: callback?.onFinish,
  };

  // Use SharedStreamingManager to handle the streaming with deduplication
  const { promise } = workflowStreamingManager.subscribe(
    streamKey,
    subscriber,
    executor,
    params.signal
  );

  return promise;
}

export async function sendEventToHandler<E extends WorkflowEvent>(params: {
  client: Client;
  handlerId: string;
  event: E;
  step?: string;
}) {
  const rawEvent = toRawEvent(params.event); // convert to raw event before sending
  const data = await postEventsByHandlerId({
    client: params.client,
    path: { handler_id: params.handlerId },
    body: {
      event: JSON.stringify(rawEvent),
      step: params.step,
    },
  });

  return data.data;
}

function toWorkflowEvents<E extends WorkflowEvent>(
  chunk: string
): {
  events: E[];
  failedLines: string[];
} {
  if (typeof chunk !== "string") {
    return { events: [], failedLines: [] };
  }

  // One chunk can contain multiple events, so we need to parse each line
  const lines = chunk
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");

  const parsedLines = lines
    .map((line) => parseChunkLine<E>(line))
    .filter(Boolean);

  // successfully parsed events
  const events = parsedLines.map((line) => line?.event).filter(Boolean) as E[];

  // failed lines that could not be parsed into events
  // will be merged into next chunk to re-try parsing
  const failedLines = parsedLines
    .filter((l) => !l?.event)
    .map((line) => line?.line || "")
    .filter(Boolean);

  return {
    events,
    failedLines,
  };
}

function parseChunkLine<E extends WorkflowEvent>(
  line: string
): {
  line: string;
  event?: E | null;
} | null {
  try {
    const event = JSON.parse(line) as RawEvent;
    if (!isRawEvent(event)) {
      return null;
    }
    return {
      line,
      event: { type: event.qualified_name, data: event.value } as E,
    };
  } catch (error: unknown) {
    // eslint-disable-next-line no-console -- needed
    console.error(`Failed to parse chunk in line: ${line}`, error);
    return {
      line,
      event: null,
    };
  }
}

function toRawEvent(event: WorkflowEvent): RawEvent {
  return {
    __is_pydantic: true,
    value: event.data ?? {},
    qualified_name: event.type,
  };
}

function isRawEvent(event: object): event is RawEvent {
  return (
    event &&
    typeof event === "object" &&
    "__is_pydantic" in event &&
    "value" in event &&
    "qualified_name" in event &&
    typeof event.qualified_name === "string"
  );
}
