import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { useHandler } from "../../src/workflows/hooks";
import { renderHookWithProviderProps } from "../test-utils";
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

/**
 * Tests for handling HTTP 500 responses that contain valid handler data.
 *
 * Server behavior (from python backend):
 * - Returns 202 when handler.status == "running"
 * - Returns 200 when handler.status == "completed"
 * - Returns 500 for other statuses (like "failed")
 *
 * But importantly, the response body still contains the full handler JSON
 * even for 500 responses. With hey-api client (ThrowOnError = false),
 * a 500 response populates the `error` field instead of `data`.
 */
describe("useHandler with 500 response containing valid handler data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show failed status when 500 response contains handler with status=failed", async () => {
    // This is what hey-api returns for a 500 response:
    // The response body goes into `error`, not `data`
    const failedHandlerData = {
      handler_id: "h-failed",
      workflow_name: "test-workflow",
      run_id: "run-123",
      error: "'CalculateRequestEvent' object has no attribute 'absolute_value'",
      result: null,
      status: "failed",
      started_at: "2026-01-06T20:43:25.386985+00:00",
      updated_at: "2026-01-06T20:43:27.399831+00:00",
      completed_at: "2026-01-06T20:43:27.399831+00:00",
    };

    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValue({
      data: undefined, // No data for 500 response
      error: failedHandlerData, // hey-api puts response body in error for non-2xx
    });

    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-failed" },
      }
    );

    // Wait for sync to complete
    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    // The handler should show as failed, NOT as not_started
    expect(result.current.state.status).toBe("failed");
    expect(result.current.state.error).toBe(
      "'CalculateRequestEvent' object has no attribute 'absolute_value'"
    );
    expect(result.current.state.handler_id).toBe("h-failed");
    expect(result.current.state.workflow_name).toBe("test-workflow");
  });

  it("should preserve error message from failed handler", async () => {
    const failedHandlerData = {
      handler_id: "h-error-test",
      workflow_name: "my-workflow",
      status: "failed",
      error: "Custom error message from workflow",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValue({
      data: undefined,
      error: failedHandlerData,
    });

    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-error-test" },
      }
    );

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    // Verify error message is preserved
    expect(result.current.state.error).toBe(
      "Custom error message from workflow"
    );
    // Should NOT have loadingError - this is a workflow error, not an API error
    expect(result.current.state.loadingError).toBeUndefined();
  });

  it("should handle manual sync() call with 500 response", async () => {
    // First, return a running handler
    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValueOnce({
      data: {
        handler_id: "h-sync-test",
        workflow_name: "test-workflow",
        status: "running",
        started_at: new Date().toISOString(),
        error: "",
      },
      error: undefined,
    });

    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-sync-test" },
      }
    );

    // Wait for initial sync
    await waitFor(() => {
      expect(result.current.state.status).toBe("running");
    });

    // Now mock a 500 response for the next sync (handler failed)
    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValueOnce({
      data: undefined,
      error: {
        handler_id: "h-sync-test",
        workflow_name: "test-workflow",
        status: "failed",
        error: "Workflow execution failed",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
    });

    // Manually trigger sync
    await act(async () => {
      await result.current.sync();
    });

    // Should update to failed status
    expect(result.current.state.status).toBe("failed");
    expect(result.current.state.error).toBe("Workflow execution failed");
  });

  it("should set loadingError for actual API errors (not handler failures)", async () => {
    // This is a true API error - not a valid handler response
    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValue({
      data: undefined,
      error: { detail: "Internal server error - database unavailable" },
    });

    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }: { id: string | null }) => useHandler(id),
      {
        initialProps: { id: "h-api-error" },
      }
    );

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    // This should be treated as an API error
    expect(result.current.state.loadingError).toBeDefined();
    // Status should NOT change to failed - it should remain not_started
    // because we couldn't fetch the actual handler state
    expect(result.current.state.status).toBe("not_started");
  });
});
