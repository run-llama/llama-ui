import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JsonSchemaEditor } from "@/src/workflows/components/json-schema-editor";

describe("JsonSchemaEditor", () => {
  const baseSchema = {
    properties: {
      title: { type: "string", title: "Title" },
      count: { type: "number", title: "Count" },
      enabled: { type: "boolean", title: "Enabled" },
      tags: { type: "array", title: "Tags", description: "List of tags" },
      config: { type: "object", title: "Config" },
    },
    required: ["title"] as string[],
  };

  it("renders string/number/boolean fields and updates values", () => {
    const onChange = vi.fn();
    render(
      <JsonSchemaEditor schema={baseSchema} values={{}} onChange={onChange} />
    );

    // String
    const titleTextarea = screen.getByLabelText(/Title/i) as HTMLTextAreaElement;
    fireEvent.change(titleTextarea, { target: { value: "Hello" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: "Hello" }));

    // Number
    const countInput = screen.getByLabelText(/Count/i) as HTMLInputElement;
    fireEvent.change(countInput, { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ count: 42 }));

    // Boolean
    const booleanTrigger = screen.getByRole("combobox");
    fireEvent.click(booleanTrigger);
    const trueItem = screen.getByText("True");
    fireEvent.click(trueItem);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });

  it("handles complex JSON fields with validation and hints", () => {
    const onChange = vi.fn();
    const onErrorsChange = vi.fn();
    render(
      <JsonSchemaEditor
        schema={baseSchema}
        values={{}}
        onChange={onChange}
        onErrorsChange={onErrorsChange}
      />
    );

    // Array field shows hint and placeholder
    const tagsTextarea = screen.getByLabelText(/Tags \(JSON\)/i) as HTMLTextAreaElement;
    expect(screen.getByText(/Expected: JSON array/i)).toBeTruthy();

    // Enter invalid JSON
    fireEvent.change(tagsTextarea, { target: { value: "[" } });
    expect(onErrorsChange).toHaveBeenCalledWith(expect.objectContaining({ tags: "Invalid JSON" }));
    expect(screen.getByText(/Invalid JSON/i)).toBeTruthy();

    // Enter valid JSON
    fireEvent.change(tagsTextarea, { target: { value: "[\"a\", \"b\"]" } });
    expect(onErrorsChange).toHaveBeenLastCalledWith(expect.objectContaining({ tags: null }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tags: ["a", "b"] }));

    // Object field hint
    const configTextarea = screen.getByLabelText(/Config \(JSON\)/i) as HTMLTextAreaElement;
    expect(screen.getByText(/Expected: JSON object/i)).toBeTruthy();

    // Clear value (no error expected)
    fireEvent.change(configTextarea, { target: { value: "" } });
    // Ensure no error message is shown for config
    expect(screen.queryByText(/Invalid JSON/i)).toBeFalsy();
  });
});

