import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExtractedDataDisplay } from "../../src/extracted-data";

describe("ExtractedDataDisplay (read-only)", () => {
  it("does not render a '+' add button for empty arrays when editable=false", () => {
    const { getByText } = render(
      <ExtractedDataDisplay
        editable={false}
        extractedData={{
          data: { tags: [] },
          original_data: {},
          field_metadata: {},
          status: "pending_review",
        }}
        jsonSchema={{
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } },
          },
        }}
      />
    );

    const emptyLabel = getByText("Empty array");
    const container = emptyLabel.parentElement;
    expect(container).toBeTruthy();
    expect(container?.querySelector("button")).toBeNull();
  });

  it("renders a '+' add button for empty arrays when editable=true", () => {
    const { getByText } = render(
      <ExtractedDataDisplay
        editable={true}
        extractedData={{
          data: { tags: [] },
          original_data: {},
          field_metadata: {},
          status: "pending_review",
        }}
        jsonSchema={{
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } },
          },
        }}
      />
    );

    const emptyLabel = getByText("Empty array");
    const container = emptyLabel.parentElement;
    expect(container).toBeTruthy();
    expect(container?.querySelector("button")).not.toBeNull();
  });
});
