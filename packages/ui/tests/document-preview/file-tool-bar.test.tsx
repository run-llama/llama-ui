import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileToolbar } from "../../src/document-preview/file-tool-bar";

const baseProps = {
  currentPage: 5,
  totalPages: 20,
  onPageChange: vi.fn(),
};

describe("FileToolbar page navigation with minPage/maxPage", () => {
  it("displays page range label when minPage and maxPage are set", () => {
    render(<FileToolbar {...baseProps} minPage={3} maxPage={7} />);
    expect(screen.getByText("3–7")).toBeTruthy();
  });

  it("displays totalPages when minPage/maxPage are not set", () => {
    render(<FileToolbar {...baseProps} />);
    expect(screen.getByText("20")).toBeTruthy();
  });

  it("disables prev button when currentPage equals minPage", () => {
    render(
      <FileToolbar
        {...baseProps}
        currentPage={3}
        minPage={3}
        maxPage={7}
        onPageChange={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
  });

  it("disables next button when currentPage equals maxPage", () => {
    render(
      <FileToolbar
        {...baseProps}
        currentPage={7}
        minPage={3}
        maxPage={7}
        onPageChange={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole("button");
    // next button is the second one (after prev)
    expect(buttons[1]).toBeDisabled();
  });

  it("calls onPageChange with previous page respecting minPage", () => {
    const onPageChange = vi.fn();
    render(
      <FileToolbar
        {...baseProps}
        currentPage={4}
        minPage={3}
        maxPage={7}
        onPageChange={onPageChange}
      />
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("does not call onPageChange when at minPage and clicking prev", () => {
    const onPageChange = vi.fn();
    render(
      <FileToolbar
        {...baseProps}
        currentPage={3}
        minPage={3}
        maxPage={7}
        onPageChange={onPageChange}
      />
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("rejects page input outside of minPage/maxPage range", () => {
    const onPageChange = vi.fn();
    render(
      <FileToolbar
        {...baseProps}
        currentPage={5}
        minPage={3}
        maxPage={7}
        onPageChange={onPageChange}
      />
    );
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.blur(input);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("accepts page input within minPage/maxPage range", () => {
    const onPageChange = vi.fn();
    render(
      <FileToolbar
        {...baseProps}
        currentPage={5}
        minPage={3}
        maxPage={7}
        onPageChange={onPageChange}
      />
    );
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "6" } });
    fireEvent.blur(input);
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it("rejects page input below minPage", () => {
    const onPageChange = vi.fn();
    render(
      <FileToolbar
        {...baseProps}
        currentPage={5}
        minPage={3}
        maxPage={7}
        onPageChange={onPageChange}
      />
    );
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.blur(input);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
