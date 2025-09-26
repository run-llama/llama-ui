import {
  useWorkflowsClient,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from "@llamaindex/ui";
import { useState, useEffect, useCallback, useRef } from "react";
import { getWorkflows, getHealth } from "@llamaindex/workflows-client";
import { WorkflowConfigPanel } from "./workflow-config-panel";
import { RunListPanel, RunListPanelHandle } from "./run-list-panel";
import { RunDetailsPanel } from "./run-details-panel";
import { Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";

// Utility to resolve base URL from query param or default
function resolveBaseUrl(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const apiParam = urlParams.get("api");

  if (apiParam) {
    return apiParam.endsWith("/") ? apiParam.slice(0, -1) : apiParam;
  }

  return "http://localhost:8000";
}

export function WorkflowDebugger() {
  const [baseUrl, setBaseUrl] = useState<string>(resolveBaseUrl);
  const [editingUrl, setEditingUrl] = useState<string>(baseUrl);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [activeHandlerId, setActiveHandlerId] = useState<string | null>(null);
  const [runDetailsTab, setRunDetailsTab] = useState<
    "visualization" | "events"
  >("visualization");
  const [workflows, setWorkflows] = useState<string[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  // Default to a 3/5 ratio (left/right) => 37.5% / 62.5%
  const [leftPanelWidth, setLeftPanelWidth] = useState(37.5); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const workflowsClient = useWorkflowsClient();
  const runListRef = useRef<RunListPanelHandle | null>(null);

  const checkHealth = useCallback(async (): Promise<void> => {
    try {
      setConnectionError(null);
      const { data, error } = await getHealth({ client: workflowsClient });
      if (error) {
        throw new Error(String(error));
      }
      if (data && (data as { status?: string }).status) {
        setIsServerHealthy(true);
      } else {
        setIsServerHealthy(false);
        setConnectionError("Workflow server is unreachable");
      }
    } catch (err) {
      setIsServerHealthy(false);
      setConnectionError("Workflow server is unreachable");
    }
  }, [workflowsClient]);

  // Update client config when baseUrl changes
  useEffect(() => {
    workflowsClient.setConfig({ baseUrl });
    void checkHealth();
    fetchWorkflows();
  }, [baseUrl, workflowsClient, checkHealth]);

  const fetchWorkflows = async () => {
    try {
      setWorkflowsLoading(true);
      const { data, error } = await getWorkflows({ client: workflowsClient });
      if (data) {
        setWorkflows(data.workflows || []);
      } else {
        if (error) console.error("Failed to fetch workflows:", error);
        setWorkflows([]);
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      setWorkflows([]);
    } finally {
      setWorkflowsLoading(false);
    }
  };

  const handleUrlSave = () => {
    const normalizedUrl = editingUrl.endsWith("/")
      ? editingUrl.slice(0, -1)
      : editingUrl;
    setBaseUrl(normalizedUrl);
  };

  const handleUrlReset = () => {
    const defaultUrl = "http://localhost:8000";
    setBaseUrl(defaultUrl);
    setEditingUrl(defaultUrl);
  };

  const handleRunStart = (handlerId: string) => {
    setActiveHandlerId(handlerId);

    // Inform the run list about the new local handler via imperative ref
    runListRef.current?.addLocalHandler(
      handlerId,
      selectedWorkflow || undefined,
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = document.querySelector(".main-content-area");
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newLeftWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain between 20% and 80%
    const clampedWidth = Math.max(20, Math.min(80, newLeftWidth));
    setLeftPanelWidth(clampedWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`h-screen flex flex-col bg-background ${
        isDragging ? "resize-active" : ""
      }`}
    >
      {/* Slim Titlebar */}
      <div className="flex items-center justify-between h-12 px-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          <h1 className="text-md font-semibold">Workflow Debugger</h1>
        </div>

        {/* Centered Workflow Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">
            Workflow:
          </label>
          <Select
            value={selectedWorkflow || ""}
            onValueChange={setSelectedWorkflow}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select workflow..." />
            </SelectTrigger>
            <SelectContent>
              {workflowsLoading ? (
                <div className="p-2">
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : workflows.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No workflows found. Check server connection.
                </div>
              ) : (
                workflows.map((workflow) => (
                  <SelectItem key={workflow} value={workflow}>
                    {workflow}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Connection + Settings */}
        <div className="flex items-center gap-2">
          {isServerHealthy !== null && (
            <span
              className={`${
                isServerHealthy ? "bg-green-500" : "bg-red-500"
              } h-2 w-2 rounded-full`}
            />
          )}
          {isServerHealthy === false && (
            <span className="text-destructive text-xs">
              {connectionError || "Workflow server is unreachable"}
            </span>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">API Configuration</h4>
                  <Input
                    value={editingUrl}
                    onChange={(e) => setEditingUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUrlSave}
                      variant="outline"
                      size="sm"
                      disabled={editingUrl === baseUrl}
                    >
                      Save
                    </Button>
                    <Button onClick={handleUrlReset} variant="outline" size="sm">
                      Reset
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current: {baseUrl}
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Recent Runs */}
        {!sidebarCollapsed && (
          <div className="w-48 border-r border-border bg-card overflow-hidden transition-all duration-200">
            <RunListPanel
              ref={runListRef}
              activeHandlerId={activeHandlerId}
              onHandlerSelect={setActiveHandlerId}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden main-content-area">
          {/* Left Panel - Form */}
          <div
            className="border-r border-border overflow-auto"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <WorkflowConfigPanel
              selectedWorkflow={selectedWorkflow}
              onRunStart={handleRunStart}
              activeHandlerId={activeHandlerId}
            />
          </div>

          {/* Resizable Gutter */}
          <div
            className={`w-2 hover:bg-gray-500/20 hover:shadow-lg cursor-col-resize flex-shrink-0 transition-all duration-200 relative group border-l border-r border-border ${
              isDragging ? "shadow-xl" : ""
            }`}
            onMouseDown={handleMouseDown}
            title="Drag to resize panels"
          ></div>

          {/* Right Panel - Results */}
          <div
            className="overflow-auto"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            <RunDetailsPanel
              handlerId={activeHandlerId}
              selectedWorkflow={selectedWorkflow}
              tab={runDetailsTab}
              onTabChange={setRunDetailsTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
