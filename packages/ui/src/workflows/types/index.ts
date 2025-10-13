// ===== Core Types =====

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JSONValue }
  | Array<JSONValue>;

export type RunStatus = "running" | "completed" | "failed" | "cancelled";

export interface WorkflowEvent {
  type: string;
  data?: JSONValue | undefined;
}

export interface StartEvent extends WorkflowEvent {
  type: WorkflowEventType.StartEvent;
  data: {
    input: JSONValue;
  };
}

export interface StopEvent extends WorkflowEvent {
  type: WorkflowEventType.StopEvent;
  data: {
    result: JSONValue;
  };
}

export interface InputRequiredEvent extends WorkflowEvent {
  type: WorkflowEventType.InputRequiredEvent;
  data: {
    prefix: string;
  };
}

export interface HumanResponseEvent extends WorkflowEvent {
  type: WorkflowEventType.HumanResponseEvent;
  data: {
    response: JSONValue;
  };
}

export interface ChatDeltaEvent extends WorkflowEvent {
  type: WorkflowEventType.ChatDeltaEvent;
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
  StartEvent = "StartEvent",
  StopEvent = "StopEvent",
  InputRequiredEvent = "InputRequiredEvent",
  HumanResponseEvent = "HumanResponseEvent",
  ChatDeltaEvent = "ChatDeltaEvent",
}

export type RawEvent = {
  __is_pydantic: boolean;
  value: JSONValue;
  qualified_name: string;
};
