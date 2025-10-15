import { useState, useEffect, useMemo } from "react";
import {
  Badge,
  Button,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useHandlerStore,
  isBuiltInEvent,
} from "@llamaindex/ui";
import type { WorkflowEvent } from "@llamaindex/ui";
import { CodeBlock } from "./code-block";
import { WorkflowVisualization } from "./workflow-visualization";
import { SendEventDialog } from "./send-event-dialog";

type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JSONValue }
  | Array<JSONValue>;

interface RunDetailsPanelProps {
  handlerId: string | null;
  selectedWorkflow?: string | null;
  tab?: "visualization" | "events";
  onTabChange?: (value: "visualization" | "events") => void;
}

export function RunDetailsPanel({
  handlerId,
  selectedWorkflow,
}: RunDetailsPanelProps) {
  const handler = useHandlerStore((state) => state.handlers[handlerId ?? ""]);
  const [compactJson, setCompactJson] = useState(false);
  const [hideInternal, setHideInternal] = useState(true);
  const [finalResult, setFinalResult] = useState<JSONValue | null>(null);
  const [finalResultError, setFinalResultError] = useState<string | null>(null);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);

  const formatJsonData = (data: unknown) => {
    if (typeof data === "string") {
      return data;
    }
    if (!data || typeof data !== "object") {
      return String(data ?? "");
    }
    return JSON.stringify(data, null, compactJson ? 0 : 2);
  };

  const formatTime = (epochMs?: number): string => {
    if (!epochMs) return "";
    const d = new Date(epochMs);
    const base = d.toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const ms = String(d.getMilliseconds()).padStart(3, "0");
    return `${base}.${ms}`;
  };

  useEffect(() => {
    if (handler) {
      handler.subscribeToEvents(
        {
          onData: (event: WorkflowEvent) => {
            setEvents((prev: WorkflowEvent[]) => {
              return [...prev, event].sort(
                (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
              );
            });
          },
          onSuccess(allEvents) {
            setEvents(allEvents);
            setFinalResult(handler.result?.data.result ?? null);
          },
          onError(error) {
            setFinalResultError(error.message);
          },
        },
        true,
      );
      return () => {
        handler.disconnect();
      };
    }
  }, [handler]);

  // Reset timestamps and result when switching handlers
  useEffect(() => {
    setFinalResult(null);
    setFinalResultError(null);
  }, [handlerId]);

  const displayedEvents: WorkflowEvent[] = useMemo(
    () =>
      hideInternal ? events.filter((event) => !isBuiltInEvent(event)) : events,
    [events, hideInternal],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Run Details</h2>
          <div className="flex items-center gap-2">
            {handler && (
              <Badge
                variant={
                  handler.status === "completed" ? "default" : "secondary"
                }
              >
                {handler.status}
              </Badge>
            )}
            <SendEventDialog
              handlerId={handlerId}
              workflowName={selectedWorkflow ?? null}
              disabled={
                !handler ||
                handler.status === "completed" ||
                handler.status === "failed"
              }
            />
          </div>
        </div>
        {handler ? (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {handler.handlerId}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedWorkflow
              ? "Visualization available before run starts"
              : "Select a workflow to visualize"}
          </p>
        )}
      </div>

      {/* Side-by-side content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Visualization */}
        <div className="flex-1 p-4 overflow-auto border-r border-border">
          <WorkflowVisualization
            workflowName={selectedWorkflow || null}
            events={events.map((e: WorkflowEvent) => ({
              type: e.type,
              data: e.data,
            }))}
            className="w-full h-full min-h-[400px]"
            isComplete={
              handler?.status === "completed" || handler?.status === "failed"
            }
          />
        </div>

        {/* Right: Events */}
        <div className="w-[480px] flex flex-col overflow-hidden">
          {/* Events Header */}
          <div className="p-4 pb-2 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">
                Event Stream ({displayedEvents.length})
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="hide-internal" className="text-xs">
                    Hide internal
                  </Label>
                  <Switch
                    id="hide-internal"
                    checked={hideInternal}
                    onCheckedChange={(v: boolean) =>
                      setHideInternal(Boolean(v))
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompactJson(!compactJson)}
                >
                  {compactJson ? "Formatted" : "Compact"}
                </Button>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-auto">
            {!handlerId ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">
                  Start a run to see events
                </p>
              </div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">
                  No events yet...
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedEvents.map((item, index) => {
                    const event = item;
                    return (
                      <TableRow
                        key={`${event.type}-${index}`}
                        data-event-index={index}
                        className={`cursor-pointer transition-colors`}
                      >
                        <TableCell className="text-xs text-muted-foreground align-top">
                          {index + 1}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-2">
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <code className="text-sm font-mono truncate">
                                  {event.type}
                                </code>
                              </div>
                              {event.timestamp !== undefined ? (
                                <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                                  {formatTime(event.timestamp.getTime())}
                                </span>
                              ) : null}
                            </div>
                            <CodeBlock
                              language={
                                typeof event.data === "string" ? "text" : "json"
                              }
                              value={formatJsonData(event.data)}
                              wrapLongLines={compactJson}
                              className="rounded border max-h-64 overflow-auto"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Final Result Section */}
          {(finalResult || finalResultError) && (
            <div className="p-4 border-t border-border">
              <h4 className="font-medium text-sm mb-2">Final Result</h4>
              {finalResultError ? (
                <div className="text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20 rounded">
                  Failed to load final result: {finalResultError}
                </div>
              ) : (
                <CodeBlock
                  language={typeof finalResult === "string" ? "text" : "json"}
                  value={
                    typeof finalResult === "string"
                      ? (finalResult as string)
                      : JSON.stringify(finalResult, null, 2)
                  }
                  className="rounded border overflow-hidden"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
