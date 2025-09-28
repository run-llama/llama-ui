import { useMemo, useState } from "react";
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

const INTERNAL_EVENT_TYPES = new Set([
  "workflows.events.StepStateChanged",
  "workflows.events.EventsQueueChanged",
]);

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

  const visibleEvents = useMemo<WorkflowEvent[]>(() => {
    if (!hideInternal) return events;
    return events.filter((e) => !INTERNAL_EVENT_TYPES.has(e.type));
  }, [events, hideInternal]);

  const formatJsonData = (data: unknown) => {
    if (!data || typeof data !== "object") {
      return String(data || "");
    }
    return JSON.stringify(data, null, compactJson ? 0 : 2);
  };

  // No timestamp management; EventList is pure presentational

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
                <h4 className="font-medium text-sm">Event Stream ({visibleEvents.length} events)</h4>
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
                ) : visibleEvents.length === 0 ? (
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
                      {visibleEvents.map((event: WorkflowEvent, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs text-muted-foreground align-top">
                            {index + 1}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="space-y-2">
                              <div className="flex items-baseline justify-between">
                                <code className="text-sm font-mono">{event.type}</code>
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
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
