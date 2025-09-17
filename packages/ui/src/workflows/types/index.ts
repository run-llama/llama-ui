// ===== Core Types =====

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JSONValue }
  | Array<JSONValue>;

export type RunStatus = "idle" | "running" | "complete" | "failed";

export interface WorkflowHandlerSummary {
  handler_id: string;
  status: RunStatus;
  result?: unknown;
  error?: unknown;
}

export interface WorkflowEvent {
  type: string;
  data?: JSONValue | undefined;
}

export interface WorkflowProgressState {
  current: number;
  total: number;
  status: RunStatus;
}

// Available events map to qualified name
export enum WorkflowEventType {
  StopEvent = "workflow.events.StopEvent",
}

export interface StreamingEventCallback<
  E extends WorkflowEvent = WorkflowEvent,
> {
  onStart?: () => void;
  onData?: (event: E) => void;
  onError?: (error: Error) => void;
  onStopEvent?: (event: E) => void;
  onFinish?: (allEvents: E[]) => void;
}

export type RawEvent = {
  __is_pydantic: boolean;
  value: JSONValue;
  qualified_name: string;
};
