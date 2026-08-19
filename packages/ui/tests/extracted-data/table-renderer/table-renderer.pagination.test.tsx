import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TableRenderer } from "@/src/extracted-data/table-renderer";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("TableRenderer pagination citation paths", () => {
  it("uses absolute row indexes for hover and click paths on page 2+", async () => {
    window.ResizeObserver = ResizeObserverMock;
    const user = userEvent.setup();
    const onHoverField = vi.fn();
    const onClickField = vi.fn();
    const data = Array.from({ length: 16 }, (_, i) => ({
      name: `creditor-${i}`,
    }));

    render(
      <TableRenderer
        data={data}
        keyPath={["creditors"]}
        editable={false}
        onHoverField={onHoverField}
        onClickField={onClickField}
      />
    );

    await user.click(screen.getByLabelText("Go to next page"));
    expect(screen.getByText(/Page 2 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText("creditor-15")).toBeInTheDocument();
    expect(screen.queryByText("creditor-5")).not.toBeInTheDocument();

    const trigger = screen
      .getByText("creditor-15")
      .closest('[data-testid="editable-field-trigger"]');
    expect(trigger).toBeTruthy();

    fireEvent.mouseEnter(trigger!);
    expect(onHoverField).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["creditors", "15", "name"],
      })
    );
    expect(onHoverField).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["creditors", "5", "name"],
      })
    );

    fireEvent.click(trigger!);
    expect(onClickField).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["creditors", "15", "name"],
      })
    );
    expect(onClickField).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["creditors", "5", "name"],
      })
    );
  });
});
