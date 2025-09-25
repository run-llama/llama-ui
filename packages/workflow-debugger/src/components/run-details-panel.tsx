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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
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
  const [compactJson, setCompactJson] = useState(true);
  const [internalTab, setInternalTab] = useState<"visualization" | "events">(
    "visualization",
  );
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      if (document.documentElement.classList.contains("dark")) return true;
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  const formatJsonData = (data: unknown) => {
    if (!data || typeof data !== "object") {
      return String(data || "");
    }
    return JSON.stringify(data, null, compactJson ? 0 : 2);
  };

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
                              <div>
                                <code className="text-sm font-mono">
                                  {event.type}
                                </code>
                              </div>
                              <div className="rounded border max-h-64 overflow-auto">
                                <SyntaxHighlighter
                                  language="json"
                                  style={isDark ? oneDark : oneLight}
                                  customStyle={{
                                    margin: 0,
                                    fontSize: "12px",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    background: "transparent",
                                    maxHeight: "none",
                                    overflow: "visible",
                                  }}
                                  wrapLongLines={compactJson}
                                  showLineNumbers={false}
                                >
                                  {formatJsonData(event.data)}
                                </SyntaxHighlighter>
                              </div>
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
