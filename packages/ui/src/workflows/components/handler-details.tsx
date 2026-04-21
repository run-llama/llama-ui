/**
 * HandlerDetails Component
 * Displays detailed information about a workflow handler and its events
 */

import { useState, useEffect } from "react";
import type { WorkflowEvent } from "../store/workflow-event";
import { Button } from "@/base/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/base/card";
import { Badge } from "@/base/badge";
import { ScrollArea } from "@/base/scroll-area";
import { useHandler } from "../hooks";
import { RunStatus } from "@/src";

export interface HandlerDetailsProps {
  handlerId: string;
  onBack?: () => void;
}

export function HandlerDetails({ handlerId, onBack }: HandlerDetailsProps) {
  const { state, subscribeToEvents } = useHandler(handlerId);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // Subscribe to events when component mounts
    if (state.status === "running") {
      setIsStreaming(true);
      const { disconnect } = subscribeToEvents(
        {
          onData: (event) => {
            setEvents((prev) => [...prev, event]);
          },
          onSuccess: (allEvents) => {
            setEvents(allEvents);
            setIsStreaming(false);
          },
          onError: () => {
            setIsStreaming(false);
          },
          onComplete: () => {
            setIsStreaming(false);
          },
        },
        { includeInternal: true }
      );

      return () => disconnect();
    }
  }, [state.status, subscribeToEvents]);

  const getStatusVariant = (status: RunStatus) => {
    switch (status) {
      case "running":
        return "default";
      case "completed":
        return "success";
      case "failed":
        return "destructive";
      case "cancelled":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Handler Details</h2>
        {onBack && (
          <Button onClick={onBack} variant="outline" label="Back to List" />
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{state.workflow_name}</CardTitle>
            <Badge
              label={state.status}
              variant={getStatusVariant(state.status)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">
                Handler ID:
              </span>
              <p className="mt-1 font-mono text-xs break-all">
                {state.handler_id}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Started At:
              </span>
              <p className="mt-1">{state.started_at.toLocaleString()}</p>
            </div>
            {state.updated_at && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Updated At:
                </span>
                <p className="mt-1">{state.updated_at.toLocaleString()}</p>
              </div>
            )}
            {state.completed_at && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Completed At:
                </span>
                <p className="mt-1">{state.completed_at.toLocaleString()}</p>
              </div>
            )}
          </div>

          {state.error && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <span className="font-medium text-destructive">Error:</span>
              <p className="mt-1 text-sm text-destructive">{state.error}</p>
            </div>
          )}

          {state.result && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-3">
              <span className="font-medium text-green-700 dark:text-green-400">
                Result:
              </span>
              <pre className="mt-1 text-xs overflow-auto">
                {JSON.stringify(state.result.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Events</CardTitle>
            {isStreaming && <Badge variant="outline" label="Streaming..." />}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No events yet. Waiting for workflow events...
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-3 text-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" label={event.type} />
                      <span className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {event.data && (
                      <pre className="text-xs overflow-auto bg-muted p-2 rounded">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
