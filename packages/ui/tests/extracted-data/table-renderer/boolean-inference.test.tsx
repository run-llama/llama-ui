import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TableRenderer } from "@/src/extracted-data/table-renderer";

describe("TableRenderer boolean type inference", () => {
  it("infers boolean type for cells without schema and shows boolean editor", async () => {
    const data = [
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

    const onUpdate = vi.fn();

    render(
      <TableRenderer
        data={data}
        onUpdate={onUpdate as any}
        keyPath={["line_items"]}
      />
    );

    // Click a boolean cell in the table
    const trueCell = await screen.findByText("true");
    await userEvent.click(trueCell);

    // The popover should include a checkbox and a combobox (select)
    const popover = await screen.findByTestId("editable-field-popover");
    expect(within(popover).getByRole("checkbox")).toBeInTheDocument();
    expect(within(popover).getByRole("combobox")).toBeInTheDocument();

    // Toggle via checkbox and save; value should be converted to boolean and passed up
    const checkbox = within(popover).getByRole("checkbox");
    await userEvent.click(checkbox);

    const save = within(popover).getByRole("button", { name: "Save" });
    await userEvent.click(save);

    // Expect update to be called with a boolean value (not a string)
    expect(onUpdate).toHaveBeenCalled();
    const callArgs = (onUpdate as any).mock.calls[0];
    // args: (index, key, value, affectedPaths)
    expect(callArgs[1]).toBe("is_tax");
    expect(typeof callArgs[2]).toBe("boolean");
  });
});
