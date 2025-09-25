import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useWorkflowHandlerList, Skeleton } from "@llamaindex/ui";

interface RunListPanelProps {
  activeHandlerId: string | null;
  onHandlerSelect: (handlerId: string) => void;
}

interface LocalHandler {
  handler_id: string;
  status: string;
  workflow_name?: string;
}

export interface RunListPanelHandle {
  addLocalHandler: (handlerId: string, workflowName?: string) => void;
}

export const RunListPanel = forwardRef<RunListPanelHandle, RunListPanelProps>(
  function RunListPanel(
    { activeHandlerId, onHandlerSelect }: RunListPanelProps,
    ref,
  ) {
    const { handlers, loading, error } = useWorkflowHandlerList("");
    const [localHandlers, setLocalHandlers] = useState<Array<LocalHandler>>([]);

    // Merge handlers from the hook with any local ones we've tracked
    useEffect(() => {
      if (handlers) {
        setLocalHandlers((prev) => {
          const existingIds = new Set(handlers.map((h) => h.handler_id));
          const localOnly = prev.filter((h) => !existingIds.has(h.handler_id));
          return [...handlers, ...localOnly];
        });
      }
    }, [handlers]);

    const addLocalHandler = (handlerId: string, workflowName?: string) => {
      setLocalHandlers((prev) => {
        const exists = prev.some((h) => h.handler_id === handlerId);
        if (exists) return prev;

        return [
          {
            handler_id: handlerId,
            status: "running",
            workflow_name: workflowName,
          },
          ...prev,
        ];
      });
    };

    useImperativeHandle(ref, () => ({ addLocalHandler }), [addLocalHandler]);

    const formatHandlerDisplay = (handler: LocalHandler) => {
      const name = handler.workflow_name || "Unknown";
      return `${name}`;
    };

    // No status visuals in compact list; dev tools-style rows

    return (
      <div className="h-full flex flex-col text-sm">
        {/* Header */}
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-xs tracking-tight">
              Recent Runs
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error State */}
          {error && (
            <div className="m-4 text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20 rounded">
              Error: {error ? String(error) : "Unknown error"}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-2 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {/* Handlers List */}
          {!loading && (
            <div className="p-2 divide-y divide-border">
              {localHandlers.length === 0 ? (
                <div className="text-muted-foreground text-xs p-3 text-center">
                  No runs yet. Start a workflow to see runs here.
                </div>
              ) : (
                localHandlers.map((handler) => (
                  <button
                    key={handler.handler_id}
                    onClick={() => onHandlerSelect(handler.handler_id)}
                    className={`w-full text-left px-2 py-1.5 transition-colors cursor-pointer border border-collapse ${
                      activeHandlerId === handler.handler_id
                        ? "bg-accent "
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <span className="truncate text-xs">
                        {formatHandlerDisplay(handler)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {handler.handler_id.slice(-8)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);
