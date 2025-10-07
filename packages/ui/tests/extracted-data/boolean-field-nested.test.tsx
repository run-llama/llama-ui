import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { TableRenderer } from "@/src/extracted-data/table-renderer";
import type { JsonObject } from "@/src/extracted-data/types";
import type { FieldSchemaMetadata } from "@/src/extracted-data/schema-reconciliation";

describe("Boolean Field in Nested Structures", () => {
  it("should render boolean fields with select dropdown even without schema metadata (runtime detection)", async () => {
    const data: JsonObject[] = [
      {
        is_tax: false,
        line_total: 22.68,
        description: "RESORT FEE",
      },
    ];

    // NO schema metadata provided - but runtime type detection should handle it
    const onUpdate = vi.fn();

    render(
      <TableRenderer
        data={data}
        onUpdate={onUpdate}
        keyPath={["line_items"]}
        metadata={{
          schema: {}, // Empty schema metadata
          extracted: {},
        }}
        editable={true}
      />
    );

    // Get the is_tax field
    const editableTriggers = screen.getAllByTestId("editable-field-trigger");
    const isTaxField = editableTriggers[0];
    expect(isTaxField).toHaveTextContent("false");

    // Click to edit the boolean field
    await userEvent.click(isTaxField);

    // Wait for popover to appear
    await waitFor(() => {
      expect(screen.getByTestId("editable-field-popover")).toBeInTheDocument();
    });

    // FIX: With runtime type detection, it should now render as select dropdown
    // even without schema metadata
    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger).toBeInTheDocument();

    // Should NOT have a textarea (which would be used for string fields)
    const textareas = screen.queryAllByRole("textbox");
    expect(textareas).toHaveLength(0);
  });

  it("should render boolean fields with select dropdown (not text input) in table", async () => {
    const data: JsonObject[] = [
      {
        is_tax: false,
        line_total: 22.68,
        description: "RESORT FEE",
      },
      {
        is_tax: true,
        line_total: 27.96,
        description: "TAX2 for ROOM CHARGE",
      },
    ];

    // Schema metadata with wildcard paths for array items
    const schemaMetadata: Record<string, FieldSchemaMetadata> = {
      "line_items.*": {
        isRequired: false,
        isOptional: true,
        schemaType: "object",
        wasMissing: false,
      },
      "line_items.*.is_tax": {
        isRequired: false,
        isOptional: true,
        schemaType: "boolean",
        title: "Is Tax",
        wasMissing: false,
      },
      "line_items.*.line_total": {
        isRequired: false,
        isOptional: true,
        schemaType: "number",
        title: "Line Total",
        wasMissing: false,
      },
      "line_items.*.description": {
        isRequired: false,
        isOptional: true,
        schemaType: "string",
        title: "Description",
        wasMissing: false,
      },
    };

    const onUpdate = vi.fn();

    render(
      <TableRenderer
        data={data}
        onUpdate={onUpdate}
        keyPath={["line_items"]}
        metadata={{
          schema: schemaMetadata,
          extracted: {},
        }}
        editable={true}
      />
    );

    // Get all editable field triggers
    const editableTriggers = screen.getAllByTestId("editable-field-trigger");

    // The first row, first column should be the is_tax field (value: false)
    const isTaxField = editableTriggers[0];
    expect(isTaxField).toHaveTextContent("false");

    // Click to edit the boolean field
    await userEvent.click(isTaxField);

    // Wait for popover to appear
    await waitFor(() => {
      expect(screen.getByTestId("editable-field-popover")).toBeInTheDocument();
    });

    // Should show a select dropdown for boolean values, not a text input
    // The select trigger should be present
    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger).toBeInTheDocument();

    // Should NOT have a textarea (which would be used for string fields)
    const textareas = screen.queryAllByRole("textbox");
    expect(textareas).toHaveLength(0);
  });

  it("should properly convert boolean field values when saved", async () => {
    const data: JsonObject[] = [
      {
        is_tax: false,
        line_total: 22.68,
        description: "RESORT FEE",
      },
    ];

    const schemaMetadata: Record<string, FieldSchemaMetadata> = {
      "line_items.*.is_tax": {
        isRequired: false,
        isOptional: true,
        schemaType: "boolean",
        title: "Is Tax",
        wasMissing: false,
      },
      "line_items.*.line_total": {
        isRequired: false,
        isOptional: true,
        schemaType: "number",
        title: "Line Total",
        wasMissing: false,
      },
      "line_items.*.description": {
        isRequired: false,
        isOptional: true,
        schemaType: "string",
        title: "Description",
        wasMissing: false,
      },
    };

    const onUpdate = vi.fn();

    render(
      <TableRenderer
        data={data}
        onUpdate={onUpdate}
        keyPath={["line_items"]}
        metadata={{
          schema: schemaMetadata,
          extracted: {},
        }}
        editable={true}
      />
    );

    // Get the is_tax field
    const editableTriggers = screen.getAllByTestId("editable-field-trigger");
    const isTaxField = editableTriggers[0];
    
    // Click to edit
    await userEvent.click(isTaxField);

    // Wait for popover
    await waitFor(() => {
      expect(screen.getByTestId("editable-field-popover")).toBeInTheDocument();
    });

    // Should have a select dropdown, not text input
    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger).toBeInTheDocument();
  });

  it("should prevent entering arbitrary string values in boolean fields", async () => {
    const data: JsonObject[] = [
      {
        is_tax: false,
        description: "RESORT FEE",
      },
    ];

    const schemaMetadata: Record<string, FieldSchemaMetadata> = {
      "line_items.*.is_tax": {
        isRequired: false,
        isOptional: true,
        schemaType: "boolean",
        title: "Is Tax",
        wasMissing: false,
      },
      "line_items.*.description": {
        isRequired: false,
        isOptional: true,
        schemaType: "string",
        title: "Description",
        wasMissing: false,
      },
    };

    const onUpdate = vi.fn();

    render(
      <TableRenderer
        data={data}
        onUpdate={onUpdate}
        keyPath={["line_items"]}
        metadata={{
          schema: schemaMetadata,
          extracted: {},
        }}
        editable={true}
      />
    );

    // Get the is_tax field
    const editableTriggers = screen.getAllByTestId("editable-field-trigger");
    const isTaxField = editableTriggers[0];
    
    // Click to edit
    await userEvent.click(isTaxField);

    // Wait for popover
    await waitFor(() => {
      expect(screen.getByTestId("editable-field-popover")).toBeInTheDocument();
    });

    // Should NOT be able to type arbitrary text
    // There should be no text input fields for the boolean value
    const textInputs = screen.queryAllByRole("textbox");
    expect(textInputs).toHaveLength(0);

    // Only a select dropdown should be present
    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger).toBeInTheDocument();
  });
});
