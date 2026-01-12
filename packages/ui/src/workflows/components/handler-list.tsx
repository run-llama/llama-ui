/**
 * HandlerList Component
 * Displays a list of workflow handlers with their status
 */

import { useHandlers } from "../hooks";
import { Button } from "@/base/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/base/card";
import { Badge } from "@/base/badge";
import { RunStatus } from "@/src";
import { HandlerState } from "../store/handler";

export interface HandlerListProps {
  onSelectHandler?: (handlerId: string) => void;
}

export function HandlerList({ onSelectHandler }: HandlerListProps) {
  const { state, sync } = useHandlers();
  const handlerList = Object.values(state.handlers);

  const getStatusColor = (status: RunStatus) => {
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
        <Button onClick={() => sync()} variant="outline" label="Refresh" />
      </div>

      {handlerList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No handlers found. Create a workflow to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {handlerList.map((handler: HandlerState) => (
            <Card
              key={handler.handler_id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelectHandler?.(handler.handler_id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {handler.workflow_name}
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
                    {handler.handler_id.slice(0, 8)}...
                  </div>
                  <div>
                    <span className="font-medium">Started:</span>{" "}
                    {handler.started_at.toLocaleString()}
                  </div>
                  {handler.completed_at && (
                    <div>
                      <span className="font-medium">Completed:</span>{" "}
                      {handler.completed_at?.toLocaleString()}
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
