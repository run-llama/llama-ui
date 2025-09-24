import {
  type Client,
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
    const accumulatedEvents: E[] = [];
    const onMessage = (event: RawEvent): boolean => {
      const workflowEvent = {
        type: event.qualified_name,
        data: event.value,
      } as E;
      accumulatedEvents.push(workflowEvent);
      try {
        subscriber.onData?.(workflowEvent);
      } catch (error) {
        console.error("Error in subscriber onData:", error); // eslint-disable-line no-console
      }
      const stopEvent = [workflowEvent].find(
        (event) => event.type === WorkflowEventType.StopEvent.toString()
      );
      if (stopEvent) {
        // For compatibility with existing callback interface
        if (callback?.onStopEvent) {
          callback.onStopEvent(stopEvent);
        }
        return true; // Stop event received, end the stream
      }
      return false;
    };

    if ("EventSource" in globalThis) {
      const baseUrl = (params.client.getConfig().baseUrl ?? "").replace(
        /\/$/,
        ""
      );
      const eventSource = new EventSource(
        `${baseUrl}/events/${encodeURIComponent(params.handlerId)}?sse=true`
      );

      const accumulatedEvents: E[] = [];

      return processUntilClosed(eventSource, onMessage, signal).then(
        () => accumulatedEvents
      );
    } else {
      const response = await getEventsByHandlerId({
        client: params.client,
        path: { handler_id: params.handlerId },
        query: { sse: true },
        signal: signal,
      });

      for await (const event of response.stream) {
        const rawEvent = event as RawEvent;
        onMessage(rawEvent);
      }

      return accumulatedEvents;
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

function toRawEvent(event: WorkflowEvent): RawEvent {
  return {
    __is_pydantic: true,
    value: event.data ?? {},
    qualified_name: event.type,
  };
}

function processUntilClosed(
  eventSource: EventSource,
  callback: (event: RawEvent) => boolean,
  abortSignal: AbortSignal
): Promise<void> {
  let resolve: () => void = () => {};
  const onAbort = () => {
    eventSource.close();
    resolve();
  };
  const promise = new Promise<void>((_resolve) => {
    resolve = _resolve;
  });

  abortSignal.addEventListener("abort", onAbort);
  const onMessage = (event: MessageEvent) => {
    try {
      if (callback(JSON.parse(event.data) as RawEvent)) {
        eventSource.close();
        resolve();
      }
    } catch (error) {
      console.error("Unexpected error in processUntilClosed callback:", error); // eslint-disable-line no-console
    }
  };
  eventSource.addEventListener("message", onMessage);
  // this error event is really noisy. Fires during reconnects, which is up to the browser, and pretty frequent.
  // Will reconnect until it gets a 204 response or manually closed.
  const onError = (_: Event) => {
    if (eventSource.readyState == EventSource.CLOSED) {
      resolve();
    }
  };
  eventSource.addEventListener("error", onError);

  return promise.then(() => {
    eventSource.removeEventListener("message", onMessage);
    eventSource.removeEventListener("error", onError);
    abortSignal.removeEventListener("abort", onAbort);
  });
}
