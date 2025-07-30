/**
 * Types for Workflow Task Suite
 * Based on workflow-task-suite.md specifications
 */

import { TaskDefinition } from '@llamaindex/llama-deploy';

// ===== Core Types =====

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | {
      [value: string]: JSONValue
    }
  | JSONValue[];

export type RunStatus = 'idle' | 'running' | 'complete' | 'error';

export interface WorkflowTaskSummary {
  task_id: string;
  session_id: string;
  service_id: string;   // workflow name
  input: string;        // task input
  deployment: string;   // deployment name
  status: RunStatus;
  createdAt: Date;
  updatedAt: Date;
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

// ===== Internal/Helper Types =====

// Extend TaskDefinition with required fields
export type WorkflowTask = TaskDefinition & {
  session_id: string;
  task_id: string;
  service_id: string;
};

// Available events map to qualified name
export enum WorkflowEventType {
  StartEvent = 'llama_index.core.workflow.events.StartEvent',
  StopEvent = 'llama_index.core.workflow.events.StopEvent',
  AgentStream = 'llama_index.core.agent.workflow.workflow_events.AgentStream',
  SourceNodesEvent = 'llama_index.core.chat_ui.events.SourceNodesEvent',
  ArtifactEvent = 'llama_index.core.chat_ui.events.ArtifactEvent',
  UIEvent = 'llama_index.core.chat_ui.events.UIEvent',
  ToolCall = 'llama_index.core.agent.workflow.workflow_events.ToolCall',
  ToolCallResult = 'llama_index.core.agent.workflow.workflow_events.ToolCallResult',
}

export interface StreamingEventCallback<E extends WorkflowEvent = WorkflowEvent> {
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