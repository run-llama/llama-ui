import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { useWorkflows } from "../../src/workflows/hooks";
import { renderHookWithProvider } from "../test-utils";
import * as workflowsClient from "@llamaindex/workflows-client";

vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual<any>("@llamaindex/workflows-client");
  return {
    ...actual,
    getWorkflows: vi.fn(),
  };
});

describe("useWorkflows loading and error state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks loading and populates workflows on success", async () => {
    (workflowsClient.getWorkflows as any).mockResolvedValue({
      data: { workflows: ["wf-1", "wf-2"] },
    });

    const { result } = renderHookWithProvider(() => useWorkflows());

    expect(result.current.state.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    expect(Object.keys(result.current.state.workflows)).toEqual([
      "wf-1",
      "wf-2",
    ]);
  });

  it("captures error and clears loading on failure", async () => {
    (workflowsClient.getWorkflows as any).mockRejectedValue(new Error("boom"));

    const { result } = renderHookWithProvider(() => useWorkflows());

    expect(result.current.state.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.loadingError).toBe("boom");
    });
  });
});
