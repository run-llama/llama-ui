export type WorkflowEventStatus =
  | "completed"
  | "current"
  | "pending"
  | "failed";

export interface WorkflowEvent {
  event_name: string;
  label?: string;
  status: WorkflowEventStatus;
  timestamp?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ProcessingStepsProps {
  workflowEvents: WorkflowEvent[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  title?: string;
}
