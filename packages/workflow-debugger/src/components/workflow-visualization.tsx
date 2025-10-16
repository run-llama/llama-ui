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
  onNodeClick?: (nodeId: string) => void;
  highlightedNodeId?: string | null;
  selectedNodeId?: string | null;
  isComplete?: boolean;
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
  onNodeClick,
  highlightedNodeId,
  selectedNodeId,
  isComplete = false,
}: WorkflowVisualizationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProcessedEventIndex, setLastProcessedEventIndex] = useState(-1);
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
      step: ({ data, id }) => {
        const isHighlighted = highlightedNodeId === id;
        const isSelected = selectedNodeId === id;

        // Always include transition for smooth fade-out
        let style: React.CSSProperties = {
          transition: "all 1s ease-out",
        };

        // If highlight color is set and not null, apply highlight styles
        if (data.highlightColor && data.highlightColor !== null) {
          style.backgroundColor = isDark ? undefined : "#CCFBEF";
          style.borderColor = data.highlightColor;
          style.boxShadow = `0 0 0 3px ${data.highlightColor}66`;
        } else if (data.highlightColor === null) {
          // Explicitly fade back to default styles
          style.backgroundColor = isDark ? "#0b1220" : "#E6EEFF";
          style.borderColor = isDark ? "#274690" : "#7EA6FF";
          style.boxShadow = "0 0 0 0px transparent";
        }

        if (isSelected) {
          style = {
            backgroundColor: isDark ? "#1e3a8a" : "#DBEAFE",
            borderColor: "#3B82F6",
            boxShadow: "0 0 0 4px #3B82F6",
            transition: "all 1s ease-out",
          };
        } else if (isHighlighted) {
          style = {
            ...style,
            borderColor: "#10B981",
            boxShadow: "0 0 0 3px #10B98166",
          };
        }
        return (
          <div
            className={
              "px-4 py-2 shadow-md rounded-md min-w-[160px] cursor-pointer transition-all " +
              // light
              "bg-[#E6EEFF] border-2 border-[#7EA6FF] " +
              // dark
              "dark:bg-[#0b1220] dark:border-[#274690] " +
              "hover:shadow-lg hover:scale-105"
            }
            style={style}
            onClick={() => onNodeClick?.(id)}
          >
            <Handle type="target" position={Position.Left} />
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-[#1E3A8A] text-sm dark:text-[#e5edff]">
                {data.label}
              </div>
              {data.workerCount > 0 && (
                <div className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#10B981] text-white text-[10px] font-bold">
                  {data.workerCount}
                </div>
              )}
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
      event: ({ data, id }) => {
        const isHighlighted = highlightedNodeId === id;
        const isSelected = selectedNodeId === id;

        // Always include transition for smooth fade-out
        let style: React.CSSProperties = {
          transition: "all 1s ease-out",
        };

        // If highlight color is set and not null, apply highlight styles
        if (data.highlightColor && data.highlightColor !== null) {
          style.backgroundColor = isDark ? undefined : "#FFE8B5";
          style.borderColor = data.highlightColor;
          style.boxShadow = `0 0 0 3px ${data.highlightColor}66`;
        } else if (data.highlightColor === null) {
          // Explicitly fade back to default styles
          style.backgroundColor = isDark ? "#241a06" : "#FFF3BF";
          style.borderColor = isDark ? "#F59E0B" : "#FFD166";
          style.boxShadow = "0 0 0 0px transparent";
        }

        if (isSelected) {
          style = {
            backgroundColor: isDark ? "#1e3a8a" : "#DBEAFE",
            borderColor: "#3B82F6",
            boxShadow: "0 0 0 4px #3B82F6",
            transition: "all 1s ease-out",
          };
        } else if (isHighlighted) {
          style = {
            ...style,
            borderColor: "#10B981",
            boxShadow: "0 0 0 3px #10B98166",
          };
        }
        return (
          <div
            className={
              "px-3 py-2 shadow-md rounded-full min-w-[140px] text-center cursor-pointer transition-all " +
              "bg-[#FFF3BF] border-2 border-[#FFD166] " +
              "dark:bg-[#241a06] dark:border-[#F59E0B] " +
              "hover:shadow-lg hover:scale-105"
            }
            style={style}
            onClick={() => onNodeClick?.(id)}
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
      external: ({ data, id }) => {
        const isHighlighted = highlightedNodeId === id;
        const isSelected = selectedNodeId === id;

        let style = data.highlightColor
          ? {
              backgroundColor: isDark ? undefined : "#FFE5D4",
              borderColor: data.highlightColor,
              boxShadow: `0 0 0 3px ${data.highlightColor}66`,
            }
          : undefined;

        if (isSelected) {
          style = {
            backgroundColor: isDark ? "#1e3a8a" : "#DBEAFE",
            borderColor: "#3B82F6",
            boxShadow: "0 0 0 4px #3B82F6",
          };
        } else if (isHighlighted) {
          style = {
            backgroundColor: style?.backgroundColor,
            borderColor: "#10B981",
            boxShadow: "0 0 0 3px #10B98166",
          };
        }
        return (
          <div
            className={
              "px-3 py-2 shadow-md rounded-lg min-w-[140px] text-center cursor-pointer transition-all " +
              "bg-[#FFEDD5] border-2 border-[#FB923C] " +
              "dark:bg-[#1f0f08] dark:border-[#ea7a3a] " +
              "hover:shadow-lg hover:scale-105"
            }
            style={style}
            onClick={() => onNodeClick?.(id)}
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
  }, [isDark, highlightedNodeId, selectedNodeId, onNodeClick]);

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
        style: {
          stroke: "var(--wf-edge-stroke)",
          strokeWidth: 2,
        },
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
  }, [workflowName, workflowsClient, layoutGraph, setNodes, setEdges]);

  useEffect(() => {
    fetchWorkflowVisualization();
  }, [fetchWorkflowVisualization]);

  // React to streaming events to highlight nodes and update last input/output
  useEffect(() => {
    if (!events || events.length === 0) {
      setLastProcessedEventIndex(-1);
      // Clear all highlights when events are cleared (new run)
      setNodes((prev) =>
        prev.map((n) => {
          const newData: Record<string, unknown> = { ...n.data };
          delete newData.highlightColor;
          delete newData.activeWorkers;
          delete newData.workerCount;
          delete newData.fadeTimestamp;
          return { ...n, data: newData } as Node;
        }),
      );
      return;
    }

    // Process only new events since last time (DO THIS BEFORE isComplete check!)
    const newEvents = events.slice(lastProcessedEventIndex + 1);

    // If no new events but workflow is complete, still trigger fade-out
    if (newEvents.length === 0) {
      return;
    }

    setLastProcessedEventIndex(events.length - 1);

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

    // Process each new event
    for (const event of newEvents) {
      const type = event?.type ?? "";
      const payload =
        (event?.data as Record<string, unknown> | undefined) ?? {};

      // Handle StepStateChanged events
      // Note: event.type is the short name like "StepStateChanged", not the qualified name
      if (
        type === "StepStateChanged" ||
        type === "workflows.events.StepStateChanged"
      ) {
        const stepName = String((payload as { name?: unknown })?.name || "");
        const stepState = String(
          (payload as { step_state?: unknown })?.step_state || "",
        );
        const workerId = String(
          (payload as { worker_id?: unknown })?.worker_id || "",
        );
        const color = stateColor(stepState);

        setNodes((prev) =>
          prev.map((n) => {
            const newData: Record<string, unknown> = { ...n.data };

            if (n.id === stepName) {
              // Track active workers for this step
              const activeWorkers = new Set<string>(
                (newData.activeWorkers as string[]) || [],
              );

              // Update worker set based on state
              if (
                stepState === "preparing" ||
                stepState === "in_progress" ||
                stepState === "running"
              ) {
                activeWorkers.add(workerId);
              } else if (
                stepState === "not_running" ||
                stepState === "not_in_progress" ||
                stepState === "exited"
              ) {
                activeWorkers.delete(workerId);
              }

              newData.activeWorkers = Array.from(activeWorkers);
              newData.workerCount = activeWorkers.size;

              // Determine highlight color based on active workers
              if (activeWorkers.size > 0) {
                // Use the color for the current state, or default to running color
                newData.highlightColor = color || "#10B981";
                newData.fadeTimestamp = Date.now();
              } else if (
                stepState === "exited" ||
                stepState === "not_running"
              ) {
                // When step exits/completes, keep the last highlight color and trigger fade-out
                // Only fade if there was a highlight to begin with
                if (newData.highlightColor) {
                  const fadeTimestamp = Date.now();
                  newData.fadeTimestamp = fadeTimestamp;

                  // Keep the highlight visible for 1s, then fade out
                  setTimeout(() => {
                    setNodes((prev) =>
                      prev.map((n) => {
                        if (
                          n.id === stepName &&
                          n.data.fadeTimestamp === fadeTimestamp
                        ) {
                          const newData: Record<string, unknown> = {
                            ...n.data,
                          };
                          newData.highlightColor = null;

                          return { ...n, data: newData } as Node;
                        }
                        return n;
                      }),
                    );
                  }, 1000);
                }
              }

              newData.lastInputEvent = getSimpleName(
                (payload as { input_event_name?: unknown })?.input_event_name,
              );
              newData.lastOutputEvent = getSimpleName(
                (payload as { output_event_name?: unknown })?.output_event_name,
              );
              newData.status = stepState;
              return { ...n, data: newData } as Node;
            }

            // Keep other nodes unchanged (don't clear their highlights)
            return n;
          }),
        );
      } else if (
        type &&
        !type.includes("workflows.events.EventsQueueChanged")
      ) {
        // Handle user-defined events (like ProgressEvent)
        const eventName = getSimpleName(
          type.replace("__main__.", "").replace("workflows.events.", ""),
        );

        setNodes((prev) =>
          prev.map((n) => {
            if (n.id === eventName && n.type === "event") {
              const newData: Record<string, unknown> = { ...n.data };
              newData.highlightColor = "#10B981";
              newData.fadeTimestamp = Date.now();
              return { ...n, data: newData } as Node;
            }
            return n;
          }),
        );

        // Clear the event highlight after 1 second
        // Don't add to cleanup array - let it run independently
        setTimeout(() => {
          setNodes((prev) =>
            prev.map((n) => {
              if (n.id === eventName && n.type === "event") {
                const newData: Record<string, unknown> = { ...n.data };
                newData.highlightColor = null;
                newData.fadeTimestamp = null;
                return { ...n, data: newData } as Node;
              }
              return n;
            }),
          );
        }, 1000);
      }
    }
  }, [events, lastProcessedEventIndex, setNodes, isComplete]);

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
