import { useState, useEffect } from "react";
import { useHandlerStore, Skeleton, Handler } from "@llamaindex/ui";

interface RunListPanelProps {
  activeHandlerId: string | null;
  onHandlerSelect: (handlerId: string) => void;
}

export function RunListPanel({ activeHandlerId, onHandlerSelect }: RunListPanelProps) {
  const { handlers, fetchRunningHandlers } = useHandlerStore();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetchRunningHandlers().finally(() => setLoading(false));
  }, [fetchRunningHandlers]);

  const formatHandlerDisplay = (handler: Handler) => {
    const name = handler.workflowName || "Unknown";
    return `${name}`;
  };

  const handlerList = Object.values(handlers);

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
            {handlerList.length === 0 ? (
              <div className="text-muted-foreground text-xs p-3 text-center">
                No runs yet. Start a workflow to see runs here.
              </div>
            ) : (
              handlerList.map((handler) => (
                <button
                  key={handler.handlerId}
                  onClick={() => onHandlerSelect(handler.handlerId)}
                  className={`w-full text-left px-2 py-1.5 transition-colors cursor-pointer border border-collapse ${
                    activeHandlerId === handler.handlerId
                      ? "bg-accent "
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <span className="truncate text-xs">
                      {formatHandlerDisplay(handler)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {handler.handlerId.slice(-8)}
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
}
