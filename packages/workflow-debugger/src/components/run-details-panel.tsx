import { useState, useEffect } from "react";
import {
  useWorkflowHandler,
  Badge,
  Button,
  Label,
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
  Switch,
} from "@llamaindex/ui";
import type { WorkflowEvent } from "@llamaindex/ui";
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
  const [hideInternal, setHideInternal] = useState(true);
  const isInternalEvent = (type: string) =>
    type === "workflows.events.StepStateChanged" ||
    type === "workflows.events.EventsQueueChanged";

  const formatJsonData = (data: unknown) => {
    if (!data || typeof data !== "object") {
      return String(data || "");
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

  // No parent-level timestamp management; handled in EventList

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
                  Event Stream ({hideInternal ? events.filter((e) => !isInternalEvent(e.type)).length : events.length} events)
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="hide-internal-events"
                      checked={hideInternal}
                      onCheckedChange={(v: boolean) => setHideInternal(Boolean(v))}
                    />
                    <Label htmlFor="hide-internal-events" className="text-xs">
                      Hide internal events
                    </Label>
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

              <div className="flex-1 overflow-auto">
                {!handlerId ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      Start a run to see events
                    </p>
                  </div>
                ) : (hideInternal ? events.filter((e) => !isInternalEvent(e.type)).length === 0 : events.length === 0) ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      No events yet...
                    </p>
                  </div>
                ) : (
                  <EventList events={events} hideInternal={hideInternal} compactJson={compactJson} formatJsonData={formatJsonData} />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EventList({
  events,
  hideInternal,
  compactJson,
  formatJsonData,
}: {
  events: WorkflowEvent[];
  hideInternal: boolean;
  compactJson: boolean;
  formatJsonData: (data: unknown | undefined) => string;
}) {
  const [timestamps, setTimestamps] = useState<number[]>([]);

  const isInternalEvent = (type: string) =>
    type === "workflows.events.StepStateChanged" ||
    type === "workflows.events.EventsQueueChanged";

  const rendered = hideInternal ? events.filter((e) => !isInternalEvent(e.type)) : events;

  useEffect(() => {
    setTimestamps((prev) => {
      if (rendered.length < prev.length) return prev.slice(0, rendered.length);
      if (rendered.length > prev.length) {
        const additions = Array.from({ length: rendered.length - prev.length }, () => Date.now());
        return [...prev, ...additions];
      }
      return prev;
    });
  }, [rendered.length]);

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

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Event</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rendered.map((event: WorkflowEvent, index: number) => (
          <TableRow key={index}>
            <TableCell className="text-xs text-muted-foreground align-top">
              {index + 1}
            </TableCell>
            <TableCell className="py-3">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <code className="text-sm font-mono">{event.type}</code>
                  {timestamps[index] !== undefined ? (
                    <span className="text-[10px] text-muted-foreground font-mono ml-2 whitespace-nowrap">
                      {formatTime(timestamps[index])}
                    </span>
                  ) : null}
                </div>
                <CodeBlock
                  language="json"
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
  );
}
