/**
 * HandlerList Component
 * Displays a list of workflow handlers with their status
 */

import { useHandlerStore } from "../hooks/use-handler-store";
import type { Handler } from "../store/handler";
import { Button } from "@/base/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/base/card";
import { Badge } from "@/base/badge";

export interface HandlerListProps {
  onSelectHandler?: (handler: Handler) => void;
}

export function HandlerList({ onSelectHandler }: HandlerListProps) {
  const handlers = useHandlerStore((state) => state.handlers);
  const fetchRunningHandlers = useHandlerStore(
    (state) => state.fetchRunningHandlers
  );

  const handlerArray = Object.values(handlers);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Workflow Handlers</h2>
        <Button onClick={() => fetchRunningHandlers()} variant="outline">
          Refresh
        </Button>
      </div>

      {handlerArray.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No handlers found. Create a workflow to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {handlerArray.map((handler) => (
            <Card
              key={handler.handlerId}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelectHandler?.(handler)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {handler.workflowName}
                  </CardTitle>
                  <Badge className={getStatusColor(handler.status)}>
                    {handler.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    <span className="font-medium">ID:</span>{" "}
                    {handler.handlerId.slice(0, 8)}...
                  </div>
                  <div>
                    <span className="font-medium">Started:</span>{" "}
                    {handler.startedAt.toLocaleString()}
                  </div>
                  {handler.completedAt && (
                    <div>
                      <span className="font-medium">Completed:</span>{" "}
                      {handler.completedAt.toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
