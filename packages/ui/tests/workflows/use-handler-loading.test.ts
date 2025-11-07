import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviderProps } from "../test-utils";
import { useHandler } from "../../src/workflows/hooks";
import * as workflowsClient from "@llamaindex/workflows-client";

vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual<any>("@llamaindex/workflows-client");
  return {
    ...actual,
    getHandlersByHandlerId: vi.fn(),
  };
});

describe("useHandler loading and loadingError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is loading initially and clears on successful sync", async () => {
    (workflowsClient.getHandlersByHandlerId as any).mockResolvedValue({
      data: {
        handler_id: "h-1",
        workflow_name: "wf-1",
        status: "running",
        started_at: new Date().toISOString(),
        error: "",
      },
    });

    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }) => useHandler(id),
      { initialProps: { id: "h-1" } }
    );

    // begins loading
    expect(result.current.state.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    expect(result.current.state.workflow_name).toBe("wf-1");
  });

  it("sets loadingError and clears loading on failed sync", async () => {
    (workflowsClient.getHandlersByHandlerId as any).mockRejectedValue(
      new Error("fetch failed")
    );

    const { result } = renderHookWithProviderProps<{ id: string | null }, any>(
      ({ id }) => useHandler(id),
      { initialProps: { id: "h-err" } }
    );

    expect(result.current.state.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.loadingError).toBe("fetch failed");
    });
  });
});
