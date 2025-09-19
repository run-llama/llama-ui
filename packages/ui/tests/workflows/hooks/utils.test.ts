import { describe, it, expect } from "vitest";
import { filterHandlersByWorkflow } from "../../../src/workflows/hooks/utils";

describe("filterHandlersByWorkflow", () => {
  it("includes handlers with matching workflowName regardless of status", () => {
    const handlers = [
      { handler_id: "a1", status: "running", workflowName: "alpha" },
      { handler_id: "a2", status: "complete", workflowName: "alpha" },
      { handler_id: "a3", status: "failed", workflowName: "alpha" },
      { handler_id: "b1", status: "running", workflowName: "beta" },
    ];

    const result = filterHandlersByWorkflow(handlers as any, "alpha");
    expect(result.map((h) => h.handler_id)).toEqual(["a1", "a2", "a3"]);
  });

  it("excludes handlers with different workflowName", () => {
    const handlers = [
      { handler_id: "a1", status: "running", workflowName: "alpha" },
      { handler_id: "b1", status: "running", workflowName: "beta" },
    ];

    const result = filterHandlersByWorkflow(handlers as any, "alpha");
    expect(result.map((h) => h.handler_id)).toEqual(["a1"]);
  });

  it("falls back to include only running handlers when metadata missing", () => {
    const handlers = [
      { handler_id: "x1", status: "running" },
      { handler_id: "x2", status: "complete" },
      { handler_id: "x3", status: "failed" },
    ];

    const result = filterHandlersByWorkflow(handlers as any, "alpha");
    expect(result.map((h) => h.handler_id)).toEqual(["x1"]);
  });

  it("mixes: includes matching metadata and running-without-metadata", () => {
    const handlers = [
      { handler_id: "a1", status: "running", workflowName: "alpha" },
      { handler_id: "a2", status: "complete", workflowName: "alpha" },
      { handler_id: "x1", status: "running" },
      { handler_id: "x2", status: "failed" },
      { handler_id: "b1", status: "running", workflowName: "beta" },
    ];

    const result = filterHandlersByWorkflow(handlers as any, "alpha");
    expect(result.map((h) => h.handler_id)).toEqual(["a1", "a2", "x1"]);
  });

  it("returns empty array for empty input", () => {
    const result = filterHandlersByWorkflow([], "alpha");
    expect(result).toEqual([]);
  });
});
