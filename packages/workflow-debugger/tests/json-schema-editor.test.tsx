import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JsonSchemaEditor } from "../src/components/json-schema-editor";

describe("JsonSchemaEditor (debugger)", () => {
  const baseSchema = {
    properties: {
      title: { type: "string", title: "Title" },
      count: { type: "number", title: "Count" },
      enabled: { type: "boolean", title: "Enabled" },
      tags: { type: "array", title: "Tags" },
    },
    required: ["title"] as string[],
  };

  it("updates primitive fields and validates arrays", () => {
    const onChange = vi.fn();
    const onErrors = vi.fn();
    render(
      <JsonSchemaEditor
        schema={baseSchema}
        values={{}}
        onChange={onChange}
        onErrorsChange={onErrors}
      />
    );

    // string
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "x" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "x" })
    );

    // number
    fireEvent.change(screen.getByLabelText(/Count/i), {
      target: { value: "1" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 })
    );

    // boolean
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("True"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    );

    // array invalid then valid
    const tags = screen.getByLabelText(/Tags \(JSON\)/i);
    fireEvent.change(tags, { target: { value: "[" } });
    expect(onErrors).toHaveBeenCalledWith(
      expect.objectContaining({ tags: "Invalid JSON" })
    );
    fireEvent.change(tags, { target: { value: '["a"]' } });
    expect(onErrors).toHaveBeenLastCalledWith(
      expect.objectContaining({ tags: null })
    );
  });

  it("correctly displays boolean false values (not truthy string conversion)", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <JsonSchemaEditor
        schema={baseSchema}
        values={{ enabled: false }}
        onChange={onChange}
      />
    );

    // Boolean false should display as "False"
    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveTextContent("False");

    // String "false" should also display as "False" (not "True" due to truthy string)
    rerender(
      <JsonSchemaEditor
        schema={baseSchema}
        values={{ enabled: "false" as unknown as boolean }}
        onChange={onChange}
      />
    );
    expect(combobox).toHaveTextContent("False");

    // Boolean true should display as "True"
    rerender(
      <JsonSchemaEditor
        schema={baseSchema}
        values={{ enabled: true }}
        onChange={onChange}
      />
    );
    expect(combobox).toHaveTextContent("True");

    // String "true" should display as "True"
    rerender(
      <JsonSchemaEditor
        schema={baseSchema}
        values={{ enabled: "true" as unknown as boolean }}
        onChange={onChange}
      />
    );
    expect(combobox).toHaveTextContent("True");
  });

  it("initializes required boolean fields to false", () => {
    const onChange = vi.fn();
    const schemaWithRequiredBoolean = {
      properties: {
        title: { type: "string", title: "Title" },
        enabled: { type: "boolean", title: "Enabled" },
      },
      required: ["title", "enabled"] as string[],
    };

    render(
      <JsonSchemaEditor
        schema={schemaWithRequiredBoolean}
        values={{}}
        onChange={onChange}
      />
    );

    // Required boolean fields should be initialized to false when undefined
    // This ensures they are always included in the payload (fixes Pydantic validation errors)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it("initializes required nullable boolean fields to null", () => {
    const onChange = vi.fn();
    const schemaWithNullableBoolean = {
      properties: {
        title: { type: "string", title: "Title" },
        enabled: { type: "boolean", title: "Enabled", nullable: true },
      },
      required: ["title", "enabled"] as string[],
    };

    render(
      <JsonSchemaEditor
        schema={schemaWithNullableBoolean}
        values={{}}
        onChange={onChange}
      />
    );

    // Required nullable boolean fields should be initialized to null
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: null })
    );
  });

  it("does not initialize optional boolean fields", () => {
    const onChange = vi.fn();
    render(
      <JsonSchemaEditor schema={baseSchema} values={{}} onChange={onChange} />
    );

    // Optional boolean fields should NOT be auto-initialized
    // (enabled is not in the required array in baseSchema)
    expect(onChange).not.toHaveBeenCalled();
  });

  it("nullable boolean shows None option and handles null values", () => {
    const onChange = vi.fn();
    const schemaWithNullableBoolean = {
      properties: {
        flag: { type: "boolean", title: "Flag", nullable: true },
      },
      required: [] as string[],
    };

    const { rerender } = render(
      <JsonSchemaEditor
        schema={schemaWithNullableBoolean}
        values={{ flag: null }}
        onChange={onChange}
      />
    );

    // Null value should display as "None"
    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveTextContent("None");

    // Selecting True should set value to true
    fireEvent.click(combobox);
    fireEvent.click(screen.getByText("True"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ flag: true })
    );

    // Rerender with true value
    rerender(
      <JsonSchemaEditor
        schema={schemaWithNullableBoolean}
        values={{ flag: true }}
        onChange={onChange}
      />
    );
    expect(combobox).toHaveTextContent("True");

    // Selecting None should set value to null
    fireEvent.click(combobox);
    fireEvent.click(screen.getByText("None"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ flag: null })
    );
  });

  it("non-nullable boolean does not show None option", () => {
    const onChange = vi.fn();
    render(
      <JsonSchemaEditor
        schema={baseSchema}
        values={{ enabled: false }}
        onChange={onChange}
      />
    );

    // Open the select dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Should have True and False options (use getAllByText since False appears in trigger too)
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getAllByText("False").length).toBeGreaterThan(0);

    // Should NOT have None option
    expect(screen.queryByText("None")).not.toBeInTheDocument();
  });

  it("handles anyOf nullable boolean pattern from Pydantic (bool | None)", () => {
    // This is the exact schema Pydantic generates for `field: bool | None = None`
    const pydanticSchema = {
      properties: {
        a: { type: "integer", title: "A" },
        b: { type: "integer", title: "B" },
        absolute_value: {
          anyOf: [{ type: "boolean" }, { type: "null" }],
          default: null,
          title: "Absolute Value",
        },
      },
      required: ["a", "b"] as string[],
    };

    const onChange = vi.fn();
    render(
      <JsonSchemaEditor
        schema={pydanticSchema as any}
        values={{ a: 1, b: 2, absolute_value: null }}
        onChange={onChange}
      />
    );

    // Should render as a boolean select dropdown, NOT a JSON textarea
    // The label should NOT have "(JSON)" suffix
    expect(
      screen.queryByLabelText(/Absolute Value \(JSON\)/i)
    ).not.toBeInTheDocument();

    // Should have a combobox for the boolean field
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBe(1);

    // Open the dropdown and verify it has True/False/None options
    fireEvent.click(comboboxes[0]);
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
    // "None" appears twice: in the trigger (current value) and in the dropdown
    expect(screen.getAllByText("None").length).toBeGreaterThanOrEqual(1);
  });

  it("handles anyOf nullable integer pattern from Pydantic (int | None)", () => {
    // Pydantic generates this for `field: int | None = None`
    const pydanticSchema = {
      properties: {
        count: {
          anyOf: [{ type: "integer" }, { type: "null" }],
          default: null,
          title: "Count",
        },
      },
      required: [] as string[],
    };

    const onChange = vi.fn();
    render(
      <JsonSchemaEditor
        schema={pydanticSchema as any}
        values={{ count: 5 }}
        onChange={onChange}
      />
    );

    // Should render as a number input, NOT a JSON textarea
    expect(screen.queryByLabelText(/Count \(JSON\)/i)).not.toBeInTheDocument();

    const input = screen.getByLabelText(/Count/i);
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveValue(5);
  });

  it("handles anyOf nullable string pattern from Pydantic (str | None)", () => {
    // Pydantic generates this for `field: str | None = None`
    const pydanticSchema = {
      properties: {
        name: {
          anyOf: [{ type: "string" }, { type: "null" }],
          default: null,
          title: "Name",
        },
      },
      required: [] as string[],
    };

    const onChange = vi.fn();
    render(
      <JsonSchemaEditor
        schema={pydanticSchema as any}
        values={{ name: "test" }}
        onChange={onChange}
      />
    );

    // Should render as a text input, NOT a JSON textarea with "(JSON)" label
    expect(screen.queryByLabelText(/Name \(JSON\)/i)).not.toBeInTheDocument();

    const input = screen.getByLabelText(/Name/i);
    expect(input.tagName.toLowerCase()).toBe("textarea");
    expect(input).toHaveValue("test");
  });
});
