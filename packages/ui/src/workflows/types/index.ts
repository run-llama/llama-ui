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
  workflowName?: string;
  result?: unknown;
  error?: unknown;
}

export interface WorkflowEvent {
  type: string;
  data?: JSONValue | undefined;
}

export interface StartEvent extends WorkflowEvent {
  type: "workflow.events.StartEvent";
  data: {
    input: JSONValue;
  };
}

export interface StopEvent extends WorkflowEvent {
  type: "workflow.events.StopEvent";
  data: {
    result: JSONValue;
  };
}

export interface InputRequiredEvent extends WorkflowEvent {
  type: "workflow.events.InputRequiredEvent";
  data: {
    prefix: string;
  };
}

export interface HumanResponseEvent extends WorkflowEvent {
  type: "workflow.events.HumanResponseEvent";
  data: {
    response: JSONValue;
  };
}

export interface ChatDeltaEvent extends WorkflowEvent {
  type: "workflow.events.ChatDeltaEvent";
  data: {
    delta: string;
  };
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
