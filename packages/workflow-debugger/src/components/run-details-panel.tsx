import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  useWorkflowHandler,
  useWorkflowsClient,
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
} from "@llamaindex/ui";
import type { WorkflowEvent } from "@llamaindex/ui";
import { CodeBlock } from "./code-block";
import { WorkflowVisualization } from "./workflow-visualization";
import { SendEventDialog } from "./send-event-dialog";
import { getResultsByHandlerId } from "@llamaindex/workflows-client";

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
  const { handler, events } = useWorkflowHandler(handlerId ?? "", !!handlerId, {
    includeInternal: true,
  });
  const workflowsClient = useWorkflowsClient();
  const [compactJson, setCompactJson] = useState(false);
  const [hideInternal, setHideInternal] = useState(true);
  const [eventTimestamps, setEventTimestamps] = useState<number[]>([]);
  const [finalResult, setFinalResult] = useState<JSONValue | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [finalResultError, setFinalResultError] = useState<string | null>(null);

  // Throttle configuration for result fetching
  const RESULT_FETCH_THROTTLE_MS = 1000;
  const lastResultFetchAtRef = useRef<number>(0);
  const pendingResultFetchTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

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

  // Clear any pending throttled fetch when handler changes or on unmount
  useEffect(() => {
    return () => {
      if (pendingResultFetchTimeoutRef.current) {
        clearTimeout(pendingResultFetchTimeoutRef.current);
        pendingResultFetchTimeoutRef.current = null;
      }
    };
  }, [handlerId]);

  // Reset timestamps and result when switching handlers
  useEffect(() => {
    setEventTimestamps([]);
    setFinalResult(null);
    setResultLoading(false);
    setFinalResultError(null);
  }, [handlerId]);

  // Append timestamps as new events arrive; trim if events are cleared
  useEffect(() => {
    setEventTimestamps((prev: number[]) => {
      if (events.length < prev.length) {
        return prev.slice(0, events.length);
      }
      if (events.length > prev.length) {
        const additions = Array.from(
          { length: events.length - prev.length },
          () => Date.now(),
        );
        return [...prev, ...additions];
      }
      return prev;
    });

    // Only depend on length to avoid re-stamping on identity changes
  }, [events.length]);

  // Determine which events are considered internal/noisy for display
  const isInternalEventType = (type: string | undefined): boolean => {
    if (!type) return false;
    return (
      type === "workflows.events.StepStateChanged" ||
      type === "workflows.events.EventsQueueChanged"
    );
  };

  // Preserve original indices to keep timestamp alignment when filtering
  const indexedEvents: { event: WorkflowEvent; originalIndex: number }[] =
    useMemo(
      () => events.map((event, i) => ({ event, originalIndex: i })),
      [events],
    );

  const displayedEvents: { event: WorkflowEvent; originalIndex: number }[] =
    useMemo(
      () =>
        hideInternal
          ? indexedEvents.filter(
              ({ event }) => !isInternalEventType(event.type),
            )
          : indexedEvents,
      [indexedEvents, hideInternal],
    );

  const fetchFinalResult = useCallback((): void => {
    if (!handlerId) return;

    const doFetchFinalResult = async (): Promise<void> => {
      try {
        lastResultFetchAtRef.current = Date.now();
        setResultLoading(true);
        setFinalResultError(null);
        const { data, error } = await getResultsByHandlerId({
          client: workflowsClient,
          path: { handler_id: handlerId },
        });
        if (data) {
          setFinalResult(
            (data as { result?: JSONValue | null })?.result ?? null,
          );
        } else if (error) {
          console.error("Failed to fetch final result:", error);
          setFinalResult(null);
          setFinalResultError(() => {
            try {
              return typeof error === "string" ? error : JSON.stringify(error);
            } catch {
              return String(error);
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch final result:", error);
        setFinalResult(null);
        setFinalResultError(() => {
          try {
            return typeof error === "string" ? error : JSON.stringify(error);
          } catch {
            return String(error);
          }
        });
      } finally {
        setResultLoading(false);
      }
    };

    const now = Date.now();
    const elapsed = now - (lastResultFetchAtRef.current || 0);

    if (elapsed < RESULT_FETCH_THROTTLE_MS) {
      const waitMs = RESULT_FETCH_THROTTLE_MS - elapsed;
      if (!pendingResultFetchTimeoutRef.current) {
        pendingResultFetchTimeoutRef.current = setTimeout(() => {
          pendingResultFetchTimeoutRef.current = null;
          void doFetchFinalResult();
        }, waitMs);
      }
      return;
    }

    void doFetchFinalResult();
  }, [handlerId, workflowsClient]);

  // Check for completion and fetch final result
  useEffect(() => {
    if (!handlerId || !handler) return;
    const isCompleted =
      handler.status === "complete" || handler.status === "failed";
    const hasStopEvent = events.some((e) => e.type.endsWith(".StopEvent"));

    if (
      (isCompleted || hasStopEvent) &&
      !finalResult &&
      !resultLoading &&
      !finalResultError
    ) {
      fetchFinalResult();
    }
  }, [
    handler,
    events,
    handlerId,
    finalResult,
    resultLoading,
    finalResultError,
    fetchFinalResult,
  ]);

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
                  handler.status === "complete" ? "default" : "secondary"
                }
              >
                {handler.status}
              </Badge>
            )}
            <SendEventDialog
              handlerId={handlerId}
              workflowName={selectedWorkflow ?? null}
              disabled={
                !handler || handler.status === "complete" || handler.status === "failed"
              }
            />
          </div>
        </div>
        {handler ? (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {handler.handler_id}
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
                    const { event, originalIndex } = item as {
                      event: WorkflowEvent;
                      originalIndex: number;
                    };
                    return (
                      <TableRow
                        key={`${originalIndex}-${event.type}`}
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
                              {eventTimestamps[originalIndex] !== undefined ? (
                                <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                                  {formatTime(eventTimestamps[originalIndex])}
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
          {(finalResult || finalResultError || resultLoading) && (
            <div className="p-4 border-t border-border">
              <h4 className="font-medium text-sm mb-2">Final Result</h4>
              {resultLoading ? (
                <div className="bg-muted p-3 rounded">
                  <div className="text-sm text-muted-foreground">
                    Loading result...
                  </div>
                </div>
              ) : finalResultError ? (
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
