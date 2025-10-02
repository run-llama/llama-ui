import { useEffect, useCallback, useMemo, useState } from "react";
import { useHandlerStore } from "./use-handler-store";
import type { WorkflowHandlerSummary, WorkflowEvent } from "../types";
import { sendEventToHandler, getExistingHandler } from "../store/helper";
import { useWorkflowsClient } from "../../lib/api-provider";

interface UseWorkflowHandlerResult {
  handler: WorkflowHandlerSummary | null;
  events: WorkflowEvent[];
  isStreaming: boolean;
  notFound: boolean;
  stopStreaming: () => void;
  clearEvents: () => void;
  sendEvent: (event: WorkflowEvent) => Promise<void>;
}

export function useWorkflowHandler(
  handlerId: string,
  autoStream: boolean = true
): UseWorkflowHandlerResult {
  const client = useWorkflowsClient();
  const handler = useHandlerStore((state) => state.handlers[handlerId] || null);
  const eventsRecord = useHandlerStore((state) => state.events);
  const subscribe = useHandlerStore((state) => state.subscribe);
  const unsubscribe = useHandlerStore((state) => state.unsubscribe);
  const isSubscribed = useHandlerStore((state) => state.isSubscribed);
  const clearEvents = useHandlerStore((state) => state.clearEvents);
  const [notFound, setNotFound] = useState(false);

  // Memoize events array to avoid creating new empty arrays
  const events = useMemo(() => {
    return eventsRecord[handlerId] || [];
  }, [eventsRecord, handlerId]);

  // Subscribe to streaming when handler changes or on mount
  useEffect(() => {
    if (!handler || !autoStream) return;
    if (handler.status !== "running") return;

    // Use store's subscribe method
    subscribe(handlerId);

    // Cleanup when handler is no longer running or component unmounts
    return () => {
      if (handler.status !== "running") {
        unsubscribe(handlerId);
      }
    };
  }, [handlerId, handler, autoStream, subscribe, unsubscribe]);

  // Detect if the handler does not exist on the server
  useEffect(() => {
    let cancelled = false;

    // Reset flag on id change
    setNotFound(false);

    // If we already have the handler locally, it's not notFound
    if (!handlerId || handler) {
      return;
    }

    // Probe server to check if handler exists
    (async () => {
      try {
        await getExistingHandler({ client, handlerId });
        if (!cancelled) setNotFound(false);
      } catch {
        if (!cancelled) setNotFound(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, handlerId, handler]);

  const stopStreaming = useCallback(() => {
    unsubscribe(handlerId);
  }, [handlerId, unsubscribe]);

  const clearHandlerEvents = useCallback(() => {
    clearEvents(handlerId);
  }, [handlerId, clearEvents]);

  const sendEvent = useCallback(
    async (event: WorkflowEvent) => {
      await sendEventToHandler({
        client,
        handlerId,
        event,
      });
    },
    [handlerId, client]
  );

  return {
    handler: handler,
    events,
    isStreaming: isSubscribed(handlerId),
    notFound,
    stopStreaming,
    clearEvents: clearHandlerEvents,
    sendEvent,
  };
}
