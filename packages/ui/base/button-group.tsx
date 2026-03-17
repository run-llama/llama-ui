import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn, normalizeCid } from "../lib/utils";
import { buttonVariants, type ButtonProps } from "./button";

type ButtonGroupContextValue = {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  orientation: "horizontal" | "vertical";
  position?: "first" | "middle" | "last" | "only";
};

const ButtonGroupContext = React.createContext<ButtonGroupContextValue>({
  orientation: "horizontal",
});

export interface ButtonGroupProps extends React.ComponentProps<"div"> {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
}

/**
 * ButtonGroup - Groups multiple ButtonGroupItem components together with
 * connected styling (shared borders and merged border-radii).
 *
 * Props:
 * - `variant` - Shared visual style for all items (default, destructive, outline, ghost, link)
 * - `size` - Shared size for all items (default, sm, icon, icon-sm)
 * - `orientation` - Layout direction: "horizontal" (default) or "vertical"
 * - All standard HTML div attributes
 *
 * Example:
 * ```tsx
 * <ButtonGroup variant="outline">
 *   <ButtonGroupItem label="Left" />
 *   <ButtonGroupItem label="Center" />
 *   <ButtonGroupItem label="Right" />
 * </ButtonGroup>
 * ```
 */
function ButtonGroup({
  variant,
  size,
  orientation = "horizontal",
  className,
  children,
  ...props
}: ButtonGroupProps) {
  const items = React.Children.toArray(children);
  const count = items.length;

  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        "inline-flex",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        className,
      )}
      {...props}
    >
      {items.map((child, index) => {
        const position: ButtonGroupContextValue["position"] =
          count === 1
            ? "only"
            : index === 0
              ? "first"
              : index === count - 1
                ? "last"
                : "middle";

        return (
          <ButtonGroupContext
            key={index}
            value={{ variant, size, orientation, position }}
          >
            {child}
          </ButtonGroupContext>
        );
      })}
    </div>
  );
}

export interface ButtonGroupItemProps
  extends Omit<React.ComponentProps<"button">, "className" | "children">,
    VariantProps<typeof buttonVariants> {
  label?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
}

function ButtonGroupItem({
  variant,
  size,
  fullWidth,
  label,
  startIcon,
  endIcon,
  isLoading,
  disabled,
  type = "button",
  ...props
}: ButtonGroupItemProps) {
  const context = React.use(ButtonGroupContext);
  const resolvedVariant = variant ?? context.variant;
  const resolvedSize = size ?? context.size;

  const positionClasses = getPositionClasses(
    context.position,
    context.orientation,
  );

  return (
    <button
      type={type}
      data-slot="button-group-item"
      className={cn(
        buttonVariants({
          variant: resolvedVariant,
          size: resolvedSize,
          fullWidth,
        }),
        positionClasses,
      )}
      disabled={isLoading || disabled}
      da-cid={label ? normalizeCid(label) : undefined}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : startIcon}
      {label && (
        <span
          className={cn(
            resolvedSize === "icon" || resolvedSize === "icon-sm"
              ? "sr-only"
              : undefined,
          )}
        >
          {label}
        </span>
      )}
      {!isLoading && endIcon}
    </button>
  );
}

function getPositionClasses(
  position: ButtonGroupContextValue["position"],
  orientation: "horizontal" | "vertical",
): string {
  if (position === "only") return "";

  const isHorizontal = orientation === "horizontal";

  switch (position) {
    case "first":
      return isHorizontal
        ? "rounded-r-none border-r-0"
        : "rounded-b-none border-b-0";
    case "middle":
      return isHorizontal
        ? "rounded-none border-r-0"
        : "rounded-none border-b-0";
    case "last":
      return isHorizontal ? "rounded-l-none" : "rounded-t-none";
    default:
      return "";
  }
}

export { ButtonGroup, ButtonGroupItem };
