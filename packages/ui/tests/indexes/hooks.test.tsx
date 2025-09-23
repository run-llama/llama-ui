import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import * as api from "llama-cloud-services/api";
import { __resetIndexStore } from "../../src/indexes/hooks/use-index-store";
import { useIndexList } from "../../src/indexes/hooks/use-index-list";
import { useIndex } from "../../src/indexes/hooks/use-index";
import { renderHookWithProvider } from "../test-utils";

vi.mock("llama-cloud-services/api", async () => {
  const actual = await vi.importActual<any>("llama-cloud-services/api");
  return {
    ...actual,
    searchPipelinesApiV1PipelinesGet: vi.fn(),
    getPipelineApiV1PipelinesPipelineIdGet: vi.fn(),
  };
});

describe("indexes hooks: list/get", () => {
  beforeEach(() => {
    __resetIndexStore();
    vi.clearAllMocks();
  });

  it("useIndexList loads pipelines", async () => {
    const pipeline = {
      id: "p1",
      name: "Pipeline 1",
      project_id: "proj",
      embedding_config: { type: "OPENAI_EMBEDDING" },
    } as any;

    (api.searchPipelinesApiV1PipelinesGet as any).mockResolvedValue({
      data: [pipeline],
      error: undefined,
    });

    const { result } = renderHookWithProvider(() => useIndexList());

    // initial loading
    expect(result.current.loading).toBe(true);

    // wait for effect to finish
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.indexes.map((p) => p.id)).toEqual(["p1"]);
  });

  it("useIndex fetches when missing and returns pipeline", async () => {
    const pipeline = {
      id: "p2",
      name: "Pipeline 2",
      project_id: "proj",
      embedding_config: { type: "OPENAI_EMBEDDING" },
    } as any;

    (api.getPipelineApiV1PipelinesPipelineIdGet as any).mockResolvedValue({
      data: pipeline,
      error: undefined,
    });

    const { result } = renderHookWithProvider(() => useIndex("p2"));

    expect(result.current.index).toBeNull();

    await act(async () => {
      // allow useEffect-triggered fetch to complete
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.index?.id).toBe("p2");
  });
});
