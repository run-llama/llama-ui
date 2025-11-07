import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProvider } from "../test-utils";
import { useHandlers } from "../../src/workflows/hooks";
import * as workflowsClient from "@llamaindex/workflows-client";

vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual<any>("@llamaindex/workflows-client");
  return {
    ...actual,
    getHandlers: vi.fn(),
  };
});

describe("useHandlers loading, error, and query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets loading initially and clears after sync", async () => {
    (workflowsClient.getHandlers as any).mockResolvedValue({
      data: {
        handlers: [
          {
            handler_id: "h-1",
            workflow_name: "wf-1",
            status: "running",
            started_at: new Date().toISOString(),
            error: "",
          },
        ],
      },
    });

    const { result } = renderHookWithProvider(() =>
      useHandlers({ sync: true })
    );

    // Immediately loading
    expect(result.current.state.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    expect(Object.keys(result.current.state.handlers)).toEqual(["h-1"]);
  });

  it("populates error and clears loading on failure", async () => {
    (workflowsClient.getHandlers as any).mockRejectedValue(
      new Error("network down")
    );

    const { result } = renderHookWithProvider(() => useHandlers());

    // starts loading
    expect(result.current.state.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.loadingError).toBe("network down");
    });
  });

  it("forwards query to API and keys separate state by query", async () => {
    (workflowsClient.getHandlers as any).mockResolvedValue({
      data: { handlers: [] },
    });

    const queryA = { workflow_name: ["wf-A"], status: ["running" as const] };
    const queryB = { workflow_name: ["wf-B"], status: ["completed" as const] };

    const { result: a } = renderHookWithProvider(() =>
      useHandlers({ query: queryA })
    );
    const { result: b } = renderHookWithProvider(() =>
      useHandlers({ query: queryB })
    );

    await waitFor(() => {
      expect(a.current.state.loading).toBe(false);
      expect(b.current.state.loading).toBe(false);
    });

    // ensure API received each query
    expect(workflowsClient.getHandlers).toHaveBeenCalledWith(
      expect.objectContaining({ query: queryA })
    );
    expect(workflowsClient.getHandlers).toHaveBeenCalledWith(
      expect.objectContaining({ query: queryB })
    );

    // ensure state instances are distinct (by key) — updating one shouldn't change the other
    expect(a.current.state.query).toEqual(queryA);
    expect(b.current.state.query).toEqual(queryB);
  });
});
