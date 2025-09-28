import { useState, useEffect } from "react";
import {
  useWorkflowHandler,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@llamaindex/ui";
import { CodeBlock } from "./code-block";
import { WorkflowVisualization } from "./workflow-visualization";

interface RunDetailsPanelProps {
  handlerId: string | null;
  selectedWorkflow?: string | null;
  tab?: "visualization" | "events";
  onTabChange?: (value: "visualization" | "events") => void;
}

export function RunDetailsPanel({
  handlerId,
  selectedWorkflow,
  tab,
  onTabChange,
}: RunDetailsPanelProps) {
  const { handler, events } = useWorkflowHandler(handlerId ?? "", !!handlerId);
  const [compactJson, setCompactJson] = useState(false);
  const [internalTab, setInternalTab] = useState<"visualization" | "events">(
    "visualization",
  );
  const [eventTimestamps, setEventTimestamps] = useState<number[]>([]);

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

  // Reset timestamps when switching handlers
  useEffect(() => {
    setEventTimestamps([]);
  }, [handlerId]);

  // Append timestamps as new events arrive; trim if events are cleared
  useEffect(() => {
    setEventTimestamps((prev) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  const currentTab: "visualization" | "events" = tab ?? internalTab;
  const handleTabChange = (value: string) => {
    const nextValue: "visualization" | "events" =
      value === "events" ? "events" : "visualization";
    if (onTabChange) onTabChange(nextValue);
    else setInternalTab(nextValue);
  };

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

      {/* Content with Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-4 pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="visualization"
            className="flex-1 flex flex-col overflow-hidden m-0"
          >
            <div className="p-4 flex-1 flex flex-col">
              <WorkflowVisualization
                workflowName={selectedWorkflow || null}
                events={events.map((e) => ({ type: e.type, data: e.data }))}
                className="w-full flex-1 min-h-[400px]"
              />
            </div>
          </TabsContent>

          <TabsContent
            value="events"
            className="flex-1 flex flex-col overflow-hidden m-0"
          >
            {/* Event Stream Table */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pb-2 flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  Event Stream ({events.length} events)
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompactJson(!compactJson)}
                >
                  {compactJson ? "Formatted" : "Compact"}
                </Button>
              </div>

              <div className="flex-1 overflow-auto">
                {!handlerId ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      Start a run to see events
                    </p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      No events yet...
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Event</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs text-muted-foreground align-top">
                            {index + 1}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="space-y-2">
                              <div className="flex items-baseline justify-between">
                                <code className="text-sm font-mono">
                                  {event.type}
                                </code>
                                {eventTimestamps[index] !== undefined ? (
                                  <span className="text-[10px] text-muted-foreground font-mono ml-2 whitespace-nowrap">
                                    {formatTime(eventTimestamps[index])}
                                  </span>
                                ) : null}
                              </div>
                              <CodeBlock
                                language={typeof event.data === "string" ? "text" : "json"}
                                value={formatJsonData(event.data)}
                                wrapLongLines={compactJson}
                                className="rounded border max-h-64 overflow-auto"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
