/**
 * Test utilities for workflows tests
 */

import { type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { ApiProvider, createMockClients } from "../src/lib";
import type { Handler as RawHandler } from "@llamaindex/workflows-client";
import { WorkflowEventType } from "../src/workflows/store/workflow-event";

// Create a wrapper function for renderHook that includes ApiProvider
export function renderHookWithProvider<T>(
  hook: () => T,
  options?: {
    apiClients?: Parameters<typeof ApiProvider>[0]["clients"];
  }
): ReturnType<typeof renderHook<T, any>> {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApiProvider clients={options?.apiClients || createMockClients()}>
      {children}
    </ApiProvider>
  );

  return renderHook(hook, { wrapper });
}

// Helper: build a RawHandler with sensible defaults, with optional overrides
export function createRawHandler(
  overrides: Partial<RawHandler> = {}
): RawHandler {
  const isComplete =
    overrides.status === "completed" ||
    overrides.status === "failed" ||
    overrides.status === "cancelled";
  return {
    handler_id: overrides.handler_id ?? "h-1",
    workflow_name: overrides.workflow_name ?? "wf",
    status: overrides.status ?? "running",
    started_at: overrides.started_at ?? new Date().toISOString(),
    updated_at:
      overrides.updated_at ?? (isComplete ? new Date().toISOString() : null),
    completed_at:
      overrides.completed_at ?? (isComplete ? new Date().toISOString() : null),
    error: overrides.error ?? null,
  } as RawHandler;
}

// Helper: build a StopEvent-like payload used by tests and mocks
export function createStopEvent(overrides?: {
  type?: string;
  qualified_name?: string;
  value?: any;
}) {
  const orType = overrides?.type ?? "StopEvent";
  return {
    type: orType,
    qualified_name: overrides?.qualified_name ?? `some.package.${orType}`,
    types:
      orType === WorkflowEventType.StopEvent
        ? []
        : [WorkflowEventType.StopEvent],
    value: overrides?.value ?? { result: { ok: true } },
  };
}
