import { useEffect, useCallback, useMemo, useState } from "react";
import { useHandlerStore } from "./use-handler-store";
import type { WorkflowHandlerSummary, WorkflowEvent } from "../types";
import { sendEventToHandler, getExistingHandler } from "../store/helper";
import { useWorkflowsClient } from "../../lib/api-provider";

interface UseWorkflowHandlerResult {
  handler: WorkflowHandlerSummary | null;
  events: WorkflowEvent[];
  isStreaming: boolean;
  stopStreaming: () => void;
  clearEvents: () => void;
  sendEvent: (event: WorkflowEvent) => Promise<void>;
  /** True when the provided handler id does not exist on the server */
  notFound: boolean;
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

  // Verify handler existence on the server when handlerId changes
  useEffect(() => {
    let cancelled = false;

    // Empty id: do not attempt to fetch
    if (!handlerId) {
      setNotFound(false);
      return;
    }

    // Optimistically assume not found is false; verify with server
    // If the handler is present locally, we still verify to catch expired/deleted cases
    (async () => {
      try {
        await getExistingHandler({ client, handlerId });
        if (!cancelled) setNotFound(false);
      } catch (_) {
        if (!cancelled) setNotFound(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, handlerId]);

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
    stopStreaming,
    clearEvents: clearHandlerEvents,
    sendEvent,
    notFound,
  };
}
