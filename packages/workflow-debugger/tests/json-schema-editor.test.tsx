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
      />,
    );

    // string
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "x" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "x" }),
    );

    // number
    fireEvent.change(screen.getByLabelText(/Count/i), {
      target: { value: "1" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 }),
    );

    // boolean
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("True"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );

    // array invalid then valid
    const tags = screen.getByLabelText(/Tags \(JSON\)/i);
    fireEvent.change(tags, { target: { value: "[" } });
    expect(onErrors).toHaveBeenCalledWith(
      expect.objectContaining({ tags: "Invalid JSON" }),
    );
    fireEvent.change(tags, { target: { value: '["a"]' } });
    expect(onErrors).toHaveBeenLastCalledWith(
      expect.objectContaining({ tags: null }),
    );
  });
});
