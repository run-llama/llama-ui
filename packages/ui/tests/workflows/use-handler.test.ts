import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { useHandler } from "../../src/workflows/hooks";
import { renderHookWithProviderProps } from "../test-utils";
import {
  WorkflowEvent,
  WorkflowEventType,
} from "../../src/workflows/store/workflow-event";
import * as workflowsClient from "@llamaindex/workflows-client";

vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual<any>("@llamaindex/workflows-client");
  return {
    ...actual,
    getHandlersByHandlerId: vi.fn(),
    postEventsByHandlerId: vi.fn(),
    postHandlersByHandlerIdCancel: vi.fn(),
  };
});

describe("useHandler can initialize after null/empty handlerId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports initializing after starting with null handlerId", async () => {
    const { result, rerender } = renderHookWithProviderProps<
      { id: string | null },
      any
    >(({ id }: { id: string | null }) => useHandler(id), {
      initialProps: { id: null },
    });

    // Starts with empty state
    expect(result.current.state.handler_id).toBe("");
    expect(result.current.state.status).toBe("not_started");

    // Sending an event without handler id should error
    await expect(
      result.current.sendEvent(
        new WorkflowEvent(WorkflowEventType.StartEvent, {})
      )
    ).rejects.toThrow("Handler ID is not yet initialized");

    // Mock server state for new handler id and then sync with provided id
    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValue({
      data: {
        handler_id: "h-1",
        workflow_name: "wf-1",
        status: "running",
        started_at: new Date().toISOString(),
        error: "",
      },
      error: undefined,
    });

    // Re-render hook with a real handlerId (control via props) - auto-sync should run
    rerender({ id: "h-1" });
    // allow useEffect-triggered sync to complete
    await waitFor(() => {
      expect(result.current.state.workflow_name).toBe("wf-1");
    });

    // After sync with explicit handler id, state should be initialized
    expect(result.current.state.handler_id).toBe("h-1");
    expect(result.current.state.workflow_name).toBe("wf-1");

    // Now sending an event should route to client with correct handler id
    (workflowsClient.postEventsByHandlerId as any).mockResolvedValue({
      data: { ok: true },
      error: undefined,
    });

    await act(async () => {
      await result.current.sendEvent(
        new WorkflowEvent(WorkflowEventType.StartEvent, {})
      );
    });

    expect(workflowsClient.postEventsByHandlerId).toHaveBeenCalledTimes(1);
    expect(workflowsClient.postEventsByHandlerId).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { handler_id: "h-1" },
      })
    );
  });

  it("immediately exposes handler_id when provided without needing sync", async () => {
    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-imm" },
      }
    );

    // handler_id should be set from the passed prop immediately
    expect(result.current.state.handler_id).toBe("h-imm");
    expect(result.current.state.status).toBe("not_started");

    // Sending an event should be allowed without calling sync
    (workflowsClient.postEventsByHandlerId as any).mockResolvedValue({
      data: { ok: true },
      error: undefined,
    });

    await act(async () => {
      await result.current.sendEvent(
        new WorkflowEvent(WorkflowEventType.StartEvent, {})
      );
    });

    expect(workflowsClient.postEventsByHandlerId).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { handler_id: "h-imm" },
      })
    );
  });
});
