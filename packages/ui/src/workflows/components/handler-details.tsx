/**
 * HandlerDetails Component
 * Displays detailed information about a workflow handler and its events
 */

import { useState, useEffect } from "react";
import type { Handler } from "../store/handler";
import type { WorkflowEvent } from "../store/workflow-event";
import { Button } from "@/base/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/base/card";
import { Badge } from "@/base/badge";
import { ScrollArea } from "@/base/scroll-area";

export interface HandlerDetailsProps {
  handler: Handler;
  onBack?: () => void;
}

export function HandlerDetails({ handler, onBack }: HandlerDetailsProps) {
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // Subscribe to events when component mounts
    if (handler.status === "running") {
      setIsStreaming(true);
      const { disconnect } = handler.subscribeToEvents(
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
        true
      );

      return () => disconnect();
    }
  }, [handler]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Handler Details</h2>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Back to List
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{handler.workflowName}</CardTitle>
            <Badge className={getStatusColor(handler.status)}>
              {handler.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">
                Handler ID:
              </span>
              <p className="mt-1 font-mono text-xs break-all">
                {handler.handlerId}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Started At:
              </span>
              <p className="mt-1">{handler.startedAt.toLocaleString()}</p>
            </div>
            {handler.updatedAt && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Updated At:
                </span>
                <p className="mt-1">{handler.updatedAt.toLocaleString()}</p>
              </div>
            )}
            {handler.completedAt && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Completed At:
                </span>
                <p className="mt-1">{handler.completedAt.toLocaleString()}</p>
              </div>
            )}
          </div>

          {handler.error && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <span className="font-medium text-destructive">Error:</span>
              <p className="mt-1 text-sm text-destructive">{handler.error}</p>
            </div>
          )}

          {handler.result && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-3">
              <span className="font-medium text-green-700 dark:text-green-400">
                Result:
              </span>
              <pre className="mt-1 text-xs overflow-auto">
                {JSON.stringify(handler.result.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Events</CardTitle>
            {isStreaming && (
              <Badge variant="outline" className="animate-pulse">
                Streaming...
              </Badge>
            )}
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
                      <Badge variant="secondary">{event.type}</Badge>
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
