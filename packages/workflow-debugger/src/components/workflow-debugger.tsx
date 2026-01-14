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
  useWorkflows,
  Label,
} from "@llamaindex/ui";
import { useState, useEffect, useCallback } from "react";
import { getHealth } from "@llamaindex/workflows-client";
import { WorkflowConfigPanel } from "./workflow-config-panel";
import { RunListPanel } from "./run-list-panel";
import { RunDetailsPanel } from "./run-details-panel";
import {
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
} from "lucide-react";
import { getDefaultWorkflowUrl } from "../lib/get-default-url";

// Utility to handle keyboard shortcuts
function useKeyboardShortcut(key: string, callback: () => void, ctrl = true) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (ctrl && e.ctrlKey && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      } else if (!ctrl && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback, ctrl]);
}

// Utility to resolve base URL from query param or default
function resolveBaseUrl(): string {
  if (typeof window === "undefined") {
    return getDefaultWorkflowUrl();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const apiParam = urlParams.get("api");

  if (apiParam) {
    return apiParam.endsWith("/") ? apiParam.slice(0, -1) : apiParam;
  }

  return getDefaultWorkflowUrl();
}

export function WorkflowDebugger() {
  const [baseUrl, setBaseUrl] = useState<string>(resolveBaseUrl);
  const [editingUrl, setEditingUrl] = useState<string>(baseUrl);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [activeHandlerId, setActiveHandlerId] = useState<string | null>(null);
  const { state: workflowsState, sync: syncWorkflows } = useWorkflows();
  // Default to a 3/5 ratio (left/right) => 37.5% / 62.5%
  const [leftPanelWidth, setLeftPanelWidth] = useState(37.5); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [configPanelCollapsed, setConfigPanelCollapsed] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const workflows = workflowsState.workflows;
  const workflowsClient = useWorkflowsClient();

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
    } catch {
      setIsServerHealthy(false);
      setConnectionError("Workflow server is unreachable");
    }
  }, [workflowsClient]);

  // Update client config when baseUrl changes
  useEffect(() => {
    workflowsClient.setConfig({ baseUrl });
    checkHealth();
    syncWorkflows();
  }, [baseUrl, workflowsClient, checkHealth, syncWorkflows]);

  const handleUrlSave = () => {
    const normalizedUrl = editingUrl.endsWith("/")
      ? editingUrl.slice(0, -1)
      : editingUrl;
    setBaseUrl(normalizedUrl);
  };

  const handleUrlReset = () => {
    const defaultUrl = getDefaultWorkflowUrl();
    setBaseUrl(defaultUrl);
    setEditingUrl(defaultUrl);
  };

  const handleRunStart = (handlerId: string) => {
    setActiveHandlerId(handlerId);
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

  // Keyboard shortcut: Ctrl+B to toggle config panel
  useKeyboardShortcut(
    "b",
    useCallback(() => {
      setConfigPanelCollapsed((prev) => !prev);
    }, []),
    true,
  );

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
            size="icon-sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            startIcon={
              sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />
            }
          />

          <h1 className="text-md font-semibold">Workflow Debugger</h1>
        </div>

        {/* Centered Workflow Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Label htmlFor="workflow" label="Workflow:" variant="standalone" />
          </div>
          <div className="w-48">
            <Select
              value={selectedWorkflow || ""}
              onValueChange={setSelectedWorkflow}
            >
              <SelectTrigger id="workflow">
                <SelectValue placeholder="Select workflow..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(workflows).map((workflow) => (
                  <SelectItem
                    key={workflow}
                    value={workflow}
                    label={workflow}
                  />
                ))}
              </SelectContent>
            </Select>
          </div>
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
              <Button variant="ghost" size="icon-sm" startIcon={<Settings />} />
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
                      label="Save"
                    />
                    <Button
                      onClick={handleUrlReset}
                      variant="outline"
                      size="sm"
                      label="Reset"
                    />
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
              activeHandlerId={activeHandlerId}
              onHandlerSelect={setActiveHandlerId}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden main-content-area">
          {/* Left Panel - Form */}
          {!configPanelCollapsed ? (
            <>
              <div
                className="border-r border-border overflow-auto"
                style={{ width: `${leftPanelWidth}%` }}
              >
                {selectedWorkflow && (
                  <WorkflowConfigPanel
                    selectedWorkflow={selectedWorkflow}
                    onRunStart={handleRunStart}
                    activeHandlerId={activeHandlerId}
                    onCollapse={() => setConfigPanelCollapsed(true)}
                  />
                )}
              </div>

              {/* Resizable Gutter */}
              <div
                className={`w-2 hover:bg-gray-500/20 hover:shadow-lg cursor-col-resize flex-shrink-0 transition-all duration-200 relative group border-l border-r border-border ${
                  isDragging ? "shadow-xl" : ""
                }`}
                onMouseDown={handleMouseDown}
                title="Drag to resize panels"
              ></div>
            </>
          ) : (
            /* Collapsed Config Panel Trigger */
            <div className="w-10 border-r border-border bg-muted/30 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setConfigPanelCollapsed(false)}
                title="Show configuration panel (Ctrl+B)"
                startIcon={<PanelRightOpen />}
              />
            </div>
          )}

          {/* Right Panel - Results */}
          <div
            className="overflow-auto"
            style={{
              width: configPanelCollapsed
                ? "calc(100% - 40px)"
                : `${100 - leftPanelWidth}%`,
            }}
          >
            {activeHandlerId && (
              <RunDetailsPanel
                handlerId={activeHandlerId}
                selectedWorkflow={selectedWorkflow}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
