import {
  Client,
  postWorkflowsByNameRunNowait,
  getHandlers,
  postEventsByHandlerId,
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
    .filter((handler: { status?: string }) => handler.status === "running")
    .map((handler: { handler_id?: string; status?: string }) => ({
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
  const handler = allHandlers.find(
    (h: { handler_id?: string }) => h.handler_id === params.handlerId
  );

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
    const { stream } = await params.client.sse.get({
      url: "/events/{handler_id}",
      path: { handler_id: params.handlerId },
      query: { sse: true },
      signal,
      // Ensure JSON payloads are passed through unchanged
      responseStyle: "data",
    });

    const accumulatedEvents: E[] = [];

    for await (const data of stream as AsyncGenerator<unknown>) {
      if (signal.aborted) {
        throw new Error("Stream aborted");
      }

      // Each `data` is expected to be a RawEvent JSON object
      if (!isRawEvent(data as object)) {
        // eslint-disable-next-line no-console -- useful during development
        console.warn("Received non-RawEvent SSE payload", data);
        continue;
      }

      const raw = data as RawEvent;
      const event = { type: raw.qualified_name, data: raw.value } as E;

      accumulatedEvents.push(event);
      subscriber.onData?.(event);

      if (event.type === WorkflowEventType.StopEvent.toString()) {
        if (callback?.onStopEvent) {
          callback.onStopEvent(event);
        }
        break;
      }
    }

    subscriber.onFinish?.(accumulatedEvents);
    return accumulatedEvents;
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
