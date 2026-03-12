import * as React from "react";
import type { ComponentRef } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { Label, type LabelProps } from "./label";

const checkboxVariants = cva(
  [
    "peer size-4 shrink-0 rounded border relative",
    "shadow-xs",
    "data-[state=unchecked]:bg-background data-[state=unchecked]:border-input",
    "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
    "focus:outline-none focus:ring-[3px] focus:ring-ring/50",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "active:opacity-60",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: "",
        box: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const checkboxWrapperVariants = cva("inline-flex items-start gap-2", {
  variants: {
    variant: {
      default: "",
      box: "rounded-md border border-input bg-card p-4 shadow-xs has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-[var(--custom-bg-primary-5-dark-bg-primary-10)] transition-colors hover:bg-accent/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type CheckboxLabelProps = Omit<LabelProps, "children" | "variant" | "htmlFor">;

export interface CheckboxProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
      "asChild" | "className"
    >,
    VariantProps<typeof checkboxVariants>,
    Partial<CheckboxLabelProps> {
  /**
   * Checkbox variant styling
   * - `default` - Standard checkbox with border and check mark
   * - `box` - Full-width card-style checkbox with border highlight on checked state
   */
}

type CheckboxGroupContextValue = {
  variant?: "default" | "box" | null;
};

const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue>({});

export interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> {
  variant?: "default" | "box";
  children?: React.ReactNode;
}

const CheckboxGroup = ({
  ref,
  variant,
  children,
}: CheckboxGroupProps & {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => {
  return (
    <CheckboxGroupContext value={{ variant }}>
      <div ref={ref} className="grid gap-3">
        {children}
      </div>
    </CheckboxGroupContext>
  );
};
CheckboxGroup.displayName = "CheckboxGroup";

/**
 * Checkbox - A controlled checkbox component with optional label support.
 *
 * Variants:
 * - `default` - Standard checkbox with check mark
 * - `box` - Card-style checkbox with full-width background and border
 *
 * Label Props (all optional):
 * - `label` - Main label text (if not provided, returns checkbox only)
 * - `description` - Helper text below the label
 * - `icon` - Icon displayed before the label
 * - `badge` - Badge text displayed next to the label
 * - `tooltip` - Tooltip content (shows info icon)
 * - `required` - Shows red asterisk
 * - `optional` - Shows "Optional" text
 *
 * Example:
 * ```tsx
 * <Checkbox label="Accept terms" required />
 * <Checkbox
 *   variant="box"
 *   label="Premium Plan"
 *   description="Unlock all features"
 *   defaultChecked
 * />
 * ```
 */
const Checkbox = ({
  ref,
  variant: variantProp,
  // Label props
  label,
  required,
  optional,
  icon,
  badge,
  tooltip,
  description,
  // Checkbox props
  disabled,
  ...props
}: CheckboxProps & {
  ref?: React.RefObject<ComponentRef<typeof CheckboxPrimitive.Root> | null>;
}) => {
  const checkboxId = React.useId();
  const context = React.use(CheckboxGroupContext);
  const variant = variantProp ?? context.variant ?? "default";

  const checkboxElement = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      className={checkboxVariants({ variant })}
      disabled={disabled}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="absolute inset-0 flex items-center justify-center text-current">
        <Check className="size-3.5" strokeWidth={2.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  // If no label is provided, return just the checkbox
  if (!label) {
    return checkboxElement;
  }

  return (
    <div
      className={cn(
        checkboxWrapperVariants({ variant }),
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        disabled && "opacity-70"
      )}
      onClick={(e) => {
        // For box variant, allow clicking anywhere in the box to select
        if (
          !disabled &&
          variant === "box" &&
          e.target instanceof Element &&
          // Don't trigger if clicking the checkbox itself or the label (which has htmlFor)
          !e.target.closest('[role="checkbox"]') &&
          !e.target.closest("label")
        ) {
          document.getElementById(checkboxId)?.click();
        }
      }}
    >
      <div className="flex h-5 items-center">{checkboxElement}</div>
      <Label
        label={label}
        htmlFor={checkboxId}
        required={required}
        optional={optional}
        icon={icon}
        badge={badge}
        tooltip={tooltip}
        description={description}
      />
    </div>
  );
};

Checkbox.displayName = "Checkbox";

export { Checkbox, CheckboxGroup };
