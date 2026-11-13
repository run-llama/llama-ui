import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "../../base/alert";
import { buttonVariants, type ButtonProps } from "../../base/button";
import { cn } from "../../lib/utils";

function expectButtonVariant(
  button: HTMLElement,
  variant: ButtonProps["variant"]
) {
  expect(button.className).toBe(cn(buttonVariants({ variant, size: "sm" })));
}

describe("Alert", () => {
  it("fires each action's own handler", () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    const onTertiary = vi.fn();
    render(
      <Alert
        variant="error"
        title="Your card was declined"
        primaryAction={{ label: "Use a different card", onClick: onPrimary }}
        secondaryAction={{
          label: "Try again with this card",
          onClick: onSecondary,
        }}
        tertiaryAction={{ label: "Turn off auto-reload", onClick: onTertiary }}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Use a different card" })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Try again with this card" })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Turn off auto-reload" })
    );

    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
    expect(onTertiary).toHaveBeenCalledTimes(1);
  });

  it("orders actions primary first, as solid, outline and ghost buttons", () => {
    render(
      <Alert
        title="Your card was declined"
        tertiaryAction={{ label: "Turn off auto-reload" }}
        secondaryAction={{ label: "Try again with this card" }}
        primaryAction={{ label: "Use a different card" }}
      />
    );

    const [primary, secondary, tertiary] = screen.getAllByRole("button");
    expect(primary).toHaveTextContent("Use a different card");
    expectButtonVariant(primary, "default");
    expect(secondary).toHaveTextContent("Try again with this card");
    expectButtonVariant(secondary, "outline");
    expect(tertiary).toHaveTextContent("Turn off auto-reload");
    expectButtonVariant(tertiary, "ghost");
  });

  it("renders an action's icon inside its button", () => {
    render(
      <Alert
        title="Credits are running low"
        primaryAction={{
          label: "Buy credits",
          icon: <svg data-testid="buy-icon" />,
        }}
      />
    );

    expect(
      screen.getByRole("button", { name: "Buy credits" })
    ).toContainElement(screen.getByTestId("buy-icon"));
  });

  it("keeps the legacy button as an outline button", () => {
    const onButtonClick = vi.fn();
    render(
      <Alert
        title="Failed to save"
        buttonLabel="Retry"
        onButtonClick={onButtonClick}
      />
    );

    const button = screen.getByRole("button", { name: "Retry" });
    expectButtonVariant(button, "outline");
    fireEvent.click(button);
    expect(onButtonClick).toHaveBeenCalledTimes(1);
  });

  it("styles the legacy button with buttonVariant", () => {
    render(
      <Alert
        variant="error"
        title="Failed to save"
        buttonLabel="Retry"
        buttonVariant="destructive"
      />
    );

    expectButtonVariant(
      screen.getByRole("button", { name: "Retry" }),
      "destructive"
    );
  });

  it("ignores the legacy button when an action is also passed", () => {
    render(
      <Alert
        title="Your card was declined"
        buttonLabel="Retry"
        primaryAction={{ label: "Use a different card" }}
      />
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button")).toHaveTextContent(
      "Use a different card"
    );
  });

  it("tags the alert and each action for analytics", () => {
    render(
      <Alert
        da-cid="card-declined"
        title="Your card was declined"
        primaryAction={{ label: "Use a different card" }}
        tertiaryAction={{ label: "Turn off auto-reload" }}
      />
    );

    expect(screen.getByRole("alert")).toHaveAttribute(
      "da-cid",
      "card-declined"
    );
    expect(
      screen.getByRole("button", { name: "Use a different card" })
    ).toHaveAttribute("da-cid", "use-a-different-card");
    expect(
      screen.getByRole("button", { name: "Turn off auto-reload" })
    ).toHaveAttribute("da-cid", "turn-off-auto-reload");
  });
});
