import { describe, it, expect } from "vitest";
import type { AgentStreamEvent } from "../../src/agent-stream-display/types";

describe("AgentStreamDisplay Types", () => {
  it("should have correct AgentStreamEvent structure", () => {
    const mockEvent: AgentStreamEvent = {
      type: "AgentStream",
      data: {
        message: "Starting file analysis...",
      },
    };

    expect(mockEvent.type).toBe("AgentStream");
    expect(mockEvent.data.message).toBe("Starting file analysis...");
    expect(typeof mockEvent.data.message).toBe("string");
  });

  it("should support different message types", () => {
    const events: AgentStreamEvent[] = [
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
      events.every((event) => typeof event.data.message === "string")
    ).toBe(true);
  });
});
