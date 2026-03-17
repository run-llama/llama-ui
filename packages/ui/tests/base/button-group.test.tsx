import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ButtonGroup, ButtonGroupItem } from "../../base/button-group";

describe("ButtonGroup", () => {
  it("renders children buttons", () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem label="First" />
        <ButtonGroupItem label="Second" />
        <ButtonGroupItem label="Third" />
      </ButtonGroup>,
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("renders with role='group'", () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem label="A" />
        <ButtonGroupItem label="B" />
      </ButtonGroup>,
    );

    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("applies horizontal orientation by default", () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem label="A" />
        <ButtonGroupItem label="B" />
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    expect(group.className).toContain("flex-row");
  });

  it("applies vertical orientation", () => {
    render(
      <ButtonGroup orientation="vertical">
        <ButtonGroupItem label="A" />
        <ButtonGroupItem label="B" />
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    expect(group.className).toContain("flex-col");
  });

  it("passes variant context to children", () => {
    render(
      <ButtonGroup variant="outline">
        <ButtonGroupItem label="A" />
        <ButtonGroupItem label="B" />
      </ButtonGroup>,
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn.className).toContain("border");
    });
  });

  it("passes size context to children", () => {
    render(
      <ButtonGroup size="sm">
        <ButtonGroupItem label="A" />
        <ButtonGroupItem label="B" />
      </ButtonGroup>,
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn.className).toContain("h-8");
    });
  });

  it("allows individual item variant override", () => {
    render(
      <ButtonGroup variant="outline">
        <ButtonGroupItem label="Default" />
        <ButtonGroupItem label="Override" variant="default" />
      </ButtonGroup>,
    );

    const overrideBtn = screen.getByText("Override").closest("button")!;
    expect(overrideBtn.className).toContain("bg-primary");
  });

  it("handles click events on items", () => {
    const onClick = vi.fn();
    render(
      <ButtonGroup>
        <ButtonGroupItem label="Click me" onClick={onClick} />
      </ButtonGroup>,
    );

    fireEvent.click(screen.getByText("Click me"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports disabled state on individual items", () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem label="Enabled" />
        <ButtonGroupItem label="Disabled" disabled />
      </ButtonGroup>,
    );

    expect(screen.getByText("Enabled").closest("button")).not.toBeDisabled();
    expect(screen.getByText("Disabled").closest("button")).toBeDisabled();
  });

  it("renders items with horizontal connected border-radius styling", () => {
    const { container } = render(
      <ButtonGroup>
        <ButtonGroupItem label="First" />
        <ButtonGroupItem label="Middle" />
        <ButtonGroupItem label="Last" />
      </ButtonGroup>,
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0].className).toContain("rounded-r-none");
    expect(buttons[0].className).toContain("border-r-0");
    expect(buttons[1].className).toContain("rounded-none");
    expect(buttons[1].className).toContain("border-r-0");
    expect(buttons[2].className).toContain("rounded-l-none");
  });

  it("renders items with vertical connected border-radius styling", () => {
    const { container } = render(
      <ButtonGroup orientation="vertical">
        <ButtonGroupItem label="First" />
        <ButtonGroupItem label="Middle" />
        <ButtonGroupItem label="Last" />
      </ButtonGroup>,
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0].className).toContain("rounded-b-none");
    expect(buttons[0].className).toContain("border-b-0");
    expect(buttons[1].className).toContain("rounded-none");
    expect(buttons[1].className).toContain("border-b-0");
    expect(buttons[2].className).toContain("rounded-t-none");
  });

  it("handles single child correctly without extra rounding classes", () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem label="Only" />
      </ButtonGroup>,
    );

    const button = screen.getByRole("button");
    expect(button.className).not.toContain("rounded-none");
    expect(button.className).not.toContain("rounded-r-none");
    expect(button.className).not.toContain("rounded-l-none");
  });

  it("supports startIcon and endIcon on items", () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem
          label="With Icons"
          startIcon={<span data-testid="start-icon">S</span>}
          endIcon={<span data-testid="end-icon">E</span>}
        />
      </ButtonGroup>,
    );

    expect(screen.getByTestId("start-icon")).toBeInTheDocument();
    expect(screen.getByTestId("end-icon")).toBeInTheDocument();
  });

  it("supports isLoading state on items", () => {
    render(
      <ButtonGroup>
        <ButtonGroupItem label="Loading" isLoading />
      </ButtonGroup>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
