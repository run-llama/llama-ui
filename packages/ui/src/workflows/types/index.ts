// ===== Core Types =====

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JSONValue }
  | Array<JSONValue>;

export type RunStatus = "running" | "completed" | "failed" | "cancelled";

export interface WorkflowProgressState {
  current: number;
  total: number;
  status: RunStatus;
}

export type RawEvent = {
  __is_pydantic: boolean;
  type: string;
  types: string[]; // ancestor classes
  value: JSONValue;
  qualified_name: string;
};
