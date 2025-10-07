import React from "react";
import { describe, it, expect, vi } from "vitest";
import { JSONSchema } from "zod/v4/core";
import { reconcileDataWithJsonSchema } from "@/src/extracted-data/schema-reconciliation";
import { TableRenderer } from "@/src/extracted-data/table-renderer";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Reduced schema from the bug report focusing on anyOf(boolean|null)
const schema: JSONSchema.ObjectSchema = {
  type: "object",
  title: "MySchema",
  required: ["currency", "grand_total"],
  properties: {
    currency: { type: "string", title: "Currency" },
    grand_total: { anyOf: [{ type: "number" }, { type: "string" }], title: "Grand Total" },
    line_items: {
      anyOf: [
        {
          type: "array",
          items: {
            type: "object",
            title: "LineItem",
            required: ["line_total"],
            properties: {
              description: {
                anyOf: [{ type: "string" }, { type: "null" }],
                default: null,
                title: "Description",
              },
              line_total: {
                anyOf: [{ type: "number" }, { type: "string" }],
                title: "Line Total",
              },
              is_tax: {
                anyOf: [{ type: "boolean" }, { type: "null" }],
                default: null,
                title: "Is Tax",
              },
            },
          },
        },
        { type: "null" },
      ],
      default: null,
      title: "Line Items",
    },
  },
};

describe("anyOf(boolean|null) renders boolean editor", () => {
  it("creates boolean metadata and renders boolean editor in table", async () => {
    const data = {
      currency: "USD",
      grand_total: 100,
      line_items: [
        { is_tax: false, line_total: 22.68, description: "RESORT FEE" },
        { is_tax: true, line_total: 27.96, description: "TAX2 for ROOM CHARGE" },
      ],
    };

    const { schemaMetadata } = reconcileDataWithJsonSchema(data as any, schema);

    // Ensure wildcard metadata exists and is boolean
    expect(schemaMetadata["line_items.*.is_tax"]).toBeDefined();
    expect(schemaMetadata["line_items.*.is_tax"].schemaType).toBe("boolean");

    // Render table using reconciled schema
    const onUpdate = vi.fn();
    render(
      <TableRenderer
        data={data.line_items as any}
        onUpdate={onUpdate as any}
        keyPath={["line_items"]}
        metadata={{ schema: schemaMetadata }}
      />
    );

    const trueCell = await screen.findByText("true");
    await userEvent.click(trueCell);

    const popover = await screen.findByTestId("editable-field-popover");
    // Boolean editor should expose a combobox (select)
    expect(within(popover).getByRole("combobox")).toBeInTheDocument();
  });
});
