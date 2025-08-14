/**
 * WorkflowProgressBar Component
 * Based on workflow-task-suite.md specifications
 */

import { useWorkflowProgress } from "../hooks/use-workflow-progress";
import { Progress } from "../../../base/progress";
import { FileText, CheckCircle, XCircle, Clock, Loader } from "lucide-react";
import { cn } from "../../../lib/utils";

interface WorkflowProgressBarProps {
  className?: string;
  /**
   * Controls auto-show/hide behavior
   * - 'auto': Show when there are tasks or status is not 'idle', hide when no tasks and status is 'idle'
   * - 'always': Always show the component
   */
  mode?: "auto" | "always";
}

export function WorkflowProgressBar({
  className,
  mode = "auto",
}: WorkflowProgressBarProps) {
  const { current, total, status } = useWorkflowProgress();

  const percentage = total > 0 ? (current / total) * 100 : 0;

  // Determine if component should be visible
  const shouldShow = () => {
    switch (mode) {
      case "always":
        return true;
      case "auto":
      default:
        // Auto mode: show when there are tasks or status is not idle
        return total > 0 || status !== "idle";
    }
  };

  // Don't render if not visible in auto mode
  if (!shouldShow()) {
    return null;
  }

  // Determine status text
  const getStatusText = () => {
    switch (status) {
      case "running":
        return "Uploaded files are processing";
      case "complete":
        return "All files processed successfully";
      case "error":
        return "Error processing files";
      case "idle":
      default:
        return "Ready to process files";
    }
  };

  // Determine status icon
  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader className="h-4 w-4 text-gray-600 animate-spin" />;
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "idle":
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div
      className={cn(
        "w-full flex items-center gap-4 p-3 border border-gray-200 rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <FileText className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {getStatusText()}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2 [&>div]:bg-black [&]:bg-gray-200 flex-1"
        aria-valuenow={current}
        aria-valuemax={total}
        aria-valuemin={0}
      />
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
          {current}/{total}
        </span>
        {getStatusIcon()}
      </div>
    </div>
  );
}
