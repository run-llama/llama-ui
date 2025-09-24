import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  BackgroundVariant,
  NodeTypes,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowsClient } from "@llamaindex/ui";
import { getWorkflowsByNameRepresentation } from "@llamaindex/workflows-client";

// Node type renderers are created inside the component so they can react to theme

interface WorkflowEventItem {
  type: string;
  data: unknown;
}

interface WorkflowVisualizationProps {
  workflowName: string | null;
  className?: string;
  events?: WorkflowEventItem[];
}

interface WorkflowGraphNode {
  id: string;
  label: string;
  node_type: "step" | "event" | "external";
  title?: string;
  event_type?: string;
}

interface WorkflowGraphEdge {
  source: string;
  target: string;
}

interface WorkflowGraphData {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
}

export function WorkflowVisualization({
  workflowName,
  className = "w-full h-[600px]",
  events,
}: WorkflowVisualizationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const nodeTypes: NodeTypes = useMemo(() => {
    return {
      step: ({ data }) => {
        const style = data.highlightColor
          ? {
              // In light mode, add a tinted fill; in dark mode, avoid washing out
              backgroundColor: isDark ? undefined : "#CCFBEF",
              borderColor: data.highlightColor,
              boxShadow: `0 0 0 3px ${data.highlightColor}66`,
            }
          : undefined;
        return (
          <div
            className={
              "px-4 py-2 shadow-md rounded-md min-w-[160px] " +
              // light
              "bg-[#E6EEFF] border-2 border-[#7EA6FF] " +
              // dark
              "dark:bg-[#0b1220] dark:border-[#274690]"
            }
            style={style}
          >
            <Handle type="target" position={Position.Left} />
            <div className="font-bold text-[#1E3A8A] text-sm dark:text-[#e5edff]">
              {data.label}
            </div>
            {data.title && (
              <div className="text-xs text-[#1D4ED8] mt-1 dark:text-[#9db4ff]">
                {data.title}
              </div>
            )}
            {(data.lastInputEvent || data.lastOutputEvent) && (
              <div className="text-[10px] text-gray-700 dark:text-gray-300 mt-1">
                {data.lastInputEvent && (
                  <div>
                    <span className="font-semibold">in:</span>{" "}
                    {data.lastInputEvent}
                  </div>
                )}
                {data.lastOutputEvent && (
                  <div>
                    <span className="font-semibold">out:</span>{" "}
                    {data.lastOutputEvent}
                  </div>
                )}
              </div>
            )}
            <Handle type="source" position={Position.Right} />
          </div>
        );
      },
      event: ({ data }) => {
        const style = data.highlightColor
          ? {
              backgroundColor: isDark ? undefined : "#FFE8B5",
              borderColor: data.highlightColor,
              boxShadow: `0 0 0 3px ${data.highlightColor}66`,
            }
          : undefined;
        return (
          <div
            className={
              "px-3 py-2 shadow-md rounded-full min-w-[140px] text-center " +
              "bg-[#FFF3BF] border-2 border-[#FFD166] " +
              "dark:bg-[#241a06] dark:border-[#F59E0B]"
            }
            style={style}
          >
            <Handle type="target" position={Position.Left} />
            <div className="font-bold text-[#92400E] text-sm dark:text-[#fde68a]">
              {data.label}
            </div>
            {data.event_type && (
              <div className="text-xs text-[#B45309] mt-1 dark:text-[#fbbf24]">
                {data.event_type}
              </div>
            )}
            <Handle type="source" position={Position.Right} />
          </div>
        );
      },
      external: ({ data }) => {
        const style = data.highlightColor
          ? {
              backgroundColor: isDark ? undefined : "#FFE5D4",
              borderColor: data.highlightColor,
              boxShadow: `0 0 0 3px ${data.highlightColor}66`,
            }
          : undefined;
        return (
          <div
            className={
              "px-3 py-2 shadow-md rounded-lg min-w-[140px] text-center " +
              "bg-[#FFEDD5] border-2 border-[#FB923C] " +
              "dark:bg-[#1f0f08] dark:border-[#ea7a3a]"
            }
            style={style}
          >
            <Handle type="target" position={Position.Left} />
            <div className="font-bold text-[#7C2D12] text-sm dark:text-[#fed7aa]">
              {data.label}
            </div>
            {data.title && (
              <div className="text-xs text-[#C2410C] mt-1 dark:text-[#fdba74]">
                {data.title}
              </div>
            )}
            <Handle type="source" position={Position.Right} />
          </div>
        );
      },
    } as NodeTypes;
  }, [isDark]);

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

  const workflowsClient = useWorkflowsClient();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Simple left-to-right DAG layout (no external deps)
  const layoutGraph = useCallback(
    (graphData: WorkflowGraphData): { nodes: Node[]; edges: Edge[] } => {
      const outEdges = new Map<string, string[]>();
      const inDegree = new Map<string, number>();

      graphData.nodes.forEach((n) => {
        outEdges.set(n.id, []);
        inDegree.set(n.id, 0);
      });

      graphData.edges.forEach(({ source, target }) => {
        outEdges.get(source)?.push(target);
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
      });

      // Kahn topological layering
      const queue: string[] = [];
      inDegree.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
      });

      const layer = new Map<string, number>();
      queue.forEach((id) => layer.set(id, 0));

      while (queue.length) {
        const id = queue.shift() as string;
        const currentLayer = layer.get(id) ?? 0;
        for (const nxt of outEdges.get(id) || []) {
          const nextLayer = Math.max(currentLayer + 1, layer.get(nxt) ?? 0);
          layer.set(nxt, nextLayer);
          inDegree.set(nxt, (inDegree.get(nxt) || 0) - 1);
          if ((inDegree.get(nxt) || 0) === 0) queue.push(nxt);
        }
      }

      // Group nodes by layer
      const layerToNodes: Record<number, string[]> = {};
      graphData.nodes.forEach((n) => {
        const l = layer.get(n.id) ?? 0;
        if (!layerToNodes[l]) layerToNodes[l] = [];
        layerToNodes[l].push(n.id);
      });

      const horizontalGap = 260;
      const verticalGap = 110;

      const positionedNodes: Node[] = graphData.nodes.map((node) => {
        const l = layer.get(node.id) ?? 0;
        const siblings = layerToNodes[l];
        const index = siblings.indexOf(node.id);
        const x = l * horizontalGap;
        const y = index * verticalGap;
        return {
          id: node.id,
          type: node.node_type,
          position: { x, y },
          data: {
            label: node.label,
            title: node.title,
            event_type: node.event_type,
            type: node.node_type,
          },
        } as Node;
      });

      const positionedEdges: Edge[] = graphData.edges.map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: false,
        style: { stroke: "var(--wf-edge-stroke)", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "var(--wf-edge-stroke)",
        },
      }));

      return { nodes: positionedNodes, edges: positionedEdges };
    },
    [],
  );

  const fetchWorkflowVisualization = useCallback(async () => {
    if (!workflowName) {
      setNodes([]);
      setEdges([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getWorkflowsByNameRepresentation({
        client: workflowsClient,
        path: { name: workflowName },
      });
      if (error) {
        throw new Error(String(error));
      }
      const graphData = (data as { graph?: WorkflowGraphData })?.graph as
        | WorkflowGraphData
        | undefined;
      if (!graphData) {
        throw new Error("No graph data received");
      }

      const laidOut = layoutGraph(graphData);
      setNodes(laidOut.nodes);
      setEdges(laidOut.edges);
    } catch (err) {
      console.error("Error fetching workflow visualization:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load workflow visualization",
      );
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [workflowName, workflowsClient]);

  useEffect(() => {
    fetchWorkflowVisualization();
  }, [fetchWorkflowVisualization]);

  // React to streaming events to highlight nodes and update last input/output
  useEffect(() => {
    if (!events || events.length === 0) return;

    const last = events[events.length - 1];
    const type = last?.type ?? "";
    const payload = (last?.data as Record<string, unknown> | undefined) ?? {};

    const getSimpleName = (raw: unknown): string => {
      if (!raw) return "";
      try {
        const str = typeof raw === "string" ? raw : String(raw);
        const cleaned = str
          .replace("<class", "")
          .replace(">", "")
          .replaceAll("'", "");
        const parts = cleaned.split(".");
        const lastPart = parts.at(-1) || "";
        return lastPart.trim();
      } catch {
        return "";
      }
    };

    // Determine which node to highlight
    let highlightId = "";
    if (
      type === "workflows.events.StepStateChanged" &&
      (payload as { name?: unknown })?.name
    ) {
      highlightId = String((payload as { name?: unknown }).name);
    } else if (type) {
      const simple = getSimpleName(
        type.replace("__main__.", "").replace("workflows.events.", ""),
      );
      highlightId = simple;
    }

    if (!highlightId) return;
    // Track active node implicitly via node highlight state

    const stateColor = (stepState?: string): string | null => {
      switch (stepState) {
        case "preparing":
          return "#3B82F6"; // blue
        case "in_progress":
          return "#F59E0B"; // amber
        case "running":
          return "#10B981"; // emerald
        case "not_running":
        case "not_in_progress":
        case "exited":
          return null;
        default:
          return "#10B981"; // default active
      }
    };

    const color =
      type === "workflows.events.StepStateChanged"
        ? stateColor(String((payload as { step_state?: unknown })?.step_state))
        : "#10B981";

    setNodes((prev) =>
      prev.map((n) => {
        const newData: Record<string, unknown> = { ...n.data };
        if (n.id === highlightId) {
          if (color) {
            newData.highlightColor = color;
          } else {
            delete newData.highlightColor; // completed or not active
          }
          if (type === "workflows.events.StepStateChanged") {
            newData.lastInputEvent = getSimpleName(
              (payload as { input_event_name?: unknown })?.input_event_name,
            );
            newData.lastOutputEvent = getSimpleName(
              (payload as { output_event_name?: unknown })?.output_event_name,
            );
            newData.status = String(
              ((payload as { step_state?: unknown })?.step_state as
                | string
                | undefined) || "",
            );
          }
          return { ...n, data: newData } as Node;
        }
        // For other nodes: keep their current highlight unless we are moving the step state
        if (type === "workflows.events.StepStateChanged") {
          // Only one active step at a time; clear highlight from others
          delete newData.highlightColor;
          return { ...n, data: newData } as Node;
        }
        return n;
      }),
    );
  }, [events?.length, setNodes]);

  if (loading) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-card border border-border rounded-lg`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">
            Loading workflow visualization...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-destructive/10 border border-destructive/30 rounded-lg`}
      >
        <div className="text-center p-4">
          <p className="text-destructive font-medium">
            Error loading visualization
          </p>
          <p className="text-sm mt-1 text-destructive">{error}</p>
          <button
            onClick={fetchWorkflowVisualization}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!workflowName) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-card border border-border rounded-lg`}
      >
        <p className="text-muted-foreground">
          Select a workflow to view its visualization
        </p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-card border border-border rounded-lg`}
      >
        <p className="text-muted-foreground">No workflow data available</p>
      </div>
    );
  }

  return (
    <div
      className={`${className} border border-border rounded-lg overflow-hidden`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "var(--wf-edge-stroke)",
          },
        }}
        fitView
        attributionPosition="bottom-left"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color={isDark ? "#374151" : "#e5e7eb"}
        />
      </ReactFlow>
    </div>
  );
}
