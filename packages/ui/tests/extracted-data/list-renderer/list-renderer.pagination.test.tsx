import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListRenderer } from "@/src/extracted-data/list-renderer";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("ListRenderer pagination citation paths", () => {
  it("uses absolute item indexes for hover and click paths on page 2+", async () => {
    window.ResizeObserver = ResizeObserverMock;
    const user = userEvent.setup();
    const onHoverField = vi.fn();
    const onClickField = vi.fn();
    const data = Array.from({ length: 16 }, (_, i) => `item-${i}`);

    render(
      <ListRenderer
        data={data}
        onUpdate={vi.fn()}
        keyPath={["tags"]}
        editable={false}
        onHoverField={onHoverField}
        onClickField={onClickField}
      />
    );

    await user.click(screen.getByLabelText("Go to next page"));
    expect(screen.getByText(/Page 2 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText("item-15")).toBeInTheDocument();
    expect(screen.queryByText("item-5")).not.toBeInTheDocument();

    const trigger = screen
      .getByText("item-15")
      .closest('[data-testid="editable-field-trigger"]');
    expect(trigger).toBeTruthy();

    fireEvent.mouseEnter(trigger!);
    expect(onHoverField).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["tags", "15"],
      })
    );
    expect(onHoverField).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["tags", "5"],
      })
    );

    fireEvent.click(trigger!);
    expect(onClickField).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["tags", "15"],
      })
    );
    expect(onClickField).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["tags", "5"],
      })
    );
  });
});
