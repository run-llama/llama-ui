import { type WorkflowEvent } from "@/src";
import { describe, it, expect } from "vitest";

describe("AgentStreamDisplay Types", () => {
  it("should have correct WorkflowEvent structure", () => {
    const mockEvent: WorkflowEvent = {
      type: "AgentStream",
      data: {
        message: "Starting file analysis...",
      },
    };

    expect(mockEvent.type).toBe("AgentStream");
    expect((mockEvent.data as any)["message"]).toBe(
      "Starting file analysis..."
    );
    expect(typeof (mockEvent.data as any)["message"]).toBe("string");
  });

  it("should support different message types", () => {
    const events: WorkflowEvent[] = [
      {
        type: "AgentStream",
        data: {
          message: "Starting file analysis...",
        },
      },
      {
        type: "AgentStream",
        data: {
          message: "Processing document with AI model...",
        },
      },
      {
        type: "AgentStream",
        data: {
          message: "Analysis complete!",
        },
      },
    ];

    expect(events).toHaveLength(3);
    expect(events.every((event) => event.type === "AgentStream")).toBe(true);
    expect(
      events.every(
        (event) => typeof (event.data as any)["message"] === "string"
      )
    ).toBe(true);
  });
});
