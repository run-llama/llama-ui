/**
 * AgentStreamDisplay Component
 * Displays real-time agent processing events from workflow tasks
 */

import { useMemo } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  Cog,
  Zap,
  Eye,
  Search,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../base/card";
import { useWorkflowTask } from "../hooks/use-workflow-task";
import type { WorkflowEvent } from "../types";

const iconPool = [
  FileText,
  Clock,
  CheckCircle,
  Cog,
  Zap,
  Eye,
  Search,
  Download,
];

const getRandomIcon = (index: number) => {
  return iconPool[index % iconPool.length];
};

interface AgentStreamDisplayProps {
  taskId: string;
  title?: string;
  maxEvents?: number;
  className?: string;
}

export function AgentStreamDisplay({
  taskId,
  title = "Agent Processing",
  maxEvents = 20,
  className,
}: AgentStreamDisplayProps) {
  const { task, events } = useWorkflowTask(taskId, true);

  // Filter and limit events to show only AgentStream events
  const agentEvents = useMemo(() => {
    return events
      .filter((event: WorkflowEvent) => {
        return (
          event.type === "AgentStream" &&
          typeof event.data === "object" &&
          event.data !== null &&
          "message" in event.data
        );
      })
      .slice(-maxEvents); // Show only the latest events
  }, [events, maxEvents]);

  // Don't render if no task or no events
  if (!task || agentEvents.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              task.status === "running"
                ? "bg-blue-500 animate-pulse"
                : task.status === "complete"
                  ? "bg-green-500"
                  : task.status === "failed"
                    ? "bg-red-500"
                    : "bg-gray-400"
            }`}
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {agentEvents.map((event, index) => {
            const Icon = getRandomIcon(index);

            return (
              <div
                key={`agent-stream-${taskId}-${index}`}
                className="flex items-center gap-3 animate-in fade-in duration-300"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-blue-900 break-words">
                    {(event.data as { message: string }).message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
