import {
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProcessingStepsProps, WorkflowEventStatus } from "./types";

const getDefaultIcon = (status: WorkflowEventStatus) => {
  switch (status) {
    case "completed":
      return CheckCircle;
    case "current":
      return Clock;
    case "failed":
      return XCircle;
    case "pending":
    default:
      return FileText;
  }
};

const getStatusStyles = (status: WorkflowEventStatus) => {
  switch (status) {
    case "completed":
      return {
        containerClass: "bg-green-100 text-green-600",
        textClass: "text-green-900",
        iconColor: "text-green-600",
      };
    case "current":
      return {
        containerClass: "bg-blue-100 text-blue-600",
        textClass: "text-blue-900",
        iconColor: "text-blue-600",
      };
    case "failed":
      return {
        containerClass: "bg-red-100 text-red-600",
        textClass: "text-red-900",
        iconColor: "text-red-600",
      };
    case "pending":
    default:
      return {
        containerClass: "bg-gray-100 text-gray-400",
        textClass: "text-gray-500",
        iconColor: "text-gray-400",
      };
  }
};

export function ProcessingSteps({
  workflowEvents,
  isCollapsed = false,
  onToggle,
  title = "Workflow Progress",
}: ProcessingStepsProps) {
  const hasFailedEvents = workflowEvents.some(
    (event) => event.status === "failed",
  );
  const allCompleted =
    workflowEvents.length > 0 &&
    workflowEvents.every((event) => event.status === "completed");
  const isComplete = allCompleted || hasFailedEvents;

  if (isComplete && isCollapsed) {
    const CollapsedIcon = hasFailedEvents ? XCircle : CheckCircle;
    const iconColor = hasFailedEvents ? "text-red-600" : "text-green-600";
    const statusText = hasFailedEvents
      ? "Processing Failed"
      : "Processing Complete";

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CollapsedIcon className={`h-4 w-4 ${iconColor}`} />
              {statusText}
            </CardTitle>
            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {isComplete && onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {workflowEvents.map((event, index) => {
            const styles = getStatusStyles(event.status);
            const Icon = event.icon || getDefaultIcon(event.status);
            const label =
              event.label ||
              event.event_name
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());

            return (
              <div
                key={`${event.event_name}-${index}`}
                className="flex items-center gap-3"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${styles.containerClass}`}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${styles.textClass}`}>
                    {label}
                  </div>
                  {event.timestamp && (
                    <div className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                {event.status === "completed" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {event.status === "current" && (
                  <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                )}
                {event.status === "failed" && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
