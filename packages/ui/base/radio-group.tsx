import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentRef } from "react";
import * as React from "react";

import { cn } from "../lib/utils";
import { Label, type LabelProps } from "./label";

const radioGroupVariants = cva("grid gap-3", {
  variants: {
    variant: {
      default: "",
      box: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const radioIndicatorVariants = cva(
  [
    "group/radio peer size-4 shrink-0 rounded-full border relative",
    // Unchecked state
    "data-[state=unchecked]:bg-background data-[state=unchecked]:border-input",
    // Checked state (default - not focused)
    "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
    // Focus state - white background with gray border ring
    "focus:!bg-background focus:!border-ring",
    "focus-visible:!bg-background focus-visible:!border-ring",
    "focus:outline-none focus-visible:outline-none",
    // Active state
    "active:opacity-60",
    // Disabled state
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default:
          "shadow-xs focus:!shadow-[0_0_0_3px_rgba(163,163,163,0.5)] focus-visible:!shadow-[0_0_0_3px_rgba(163,163,163,0.5)]",
        box: "focus:!shadow-[0_0_0_3px_rgba(163,163,163,0.5)] focus-visible:!shadow-[0_0_0_3px_rgba(163,163,163,0.5)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const radioItemWrapperVariants = cva("inline-flex items-start gap-3", {
  variants: {
    variant: {
      default: "",
      box: "rounded-lg border border-input bg-card p-4 shadow-xs has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-[var(--custom-bg-primary-5-dark-bg-primary-10)] transition-colors hover:bg-accent/50",
    },
    controlPlacement: {
      start: "",
      end: "flex-row-reverse justify-between w-full",
    },
  },
  defaultVariants: {
    variant: "default",
    controlPlacement: "start",
  },
});

export interface RadioGroupProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
      "asChild" | "className"
    >,
    VariantProps<typeof radioGroupVariants> {
  /**
   * RadioGroup variant styling
   * - "default" - Standard radio buttons in a column layout
   * - "box" - Card-style radio items with border and background
   */
}

const RadioGroup = ({
  ref,
  variant,
  ...props
}: RadioGroupProps & {
  ref?: React.RefObject<ComponentRef<typeof RadioGroupPrimitive.Root> | null>;
}) => {
  return (
    <RadioGroupContext value={{ variant }}>
      <RadioGroupPrimitive.Root
        ref={ref}
        className={radioGroupVariants({ variant })}
        {...props}
      />
    </RadioGroupContext>
  );
};

RadioGroup.displayName = "RadioGroup";

type RadioGroupContextValue = {
  variant?: "default" | "box" | null;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

type RadioGroupLabelProps = Omit<
  LabelProps,
  "children" | "variant" | "htmlFor"
>;

export interface RadioGroupItemProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
      "asChild" | "children" | "className"
    >,
    VariantProps<typeof radioIndicatorVariants>,
    Partial<RadioGroupLabelProps> {
  /** Position of the radio control relative to label ("start" | "end", default: "start") */
  controlPlacement?: "start" | "end";
}

/**
 * RadioGroup & RadioGroupItem - A controlled radio button group component.
 *
 * Features:
 * - Two variants: "default" and "box"
 * - Optional label support with required/optional indicators
 * - Icon, badge, tooltip, and description support
 * - Control placement: start (left) or end (right)
 *
 * Example:
 * ```tsx
 * <RadioGroup defaultValue="monthly">
 *   <RadioGroupItem
 *     value="monthly"
 *     label="Monthly Plan"
 *     description="$9.99 per month"
 *   />
 *   <RadioGroupItem
 *     value="yearly"
 *     label="Yearly Plan"
 *     description="$99 per year (Save $20)"
 *   />
 * </RadioGroup>
 *
 * // Box variant
 * <RadioGroup variant="box" defaultValue="option1">
 *   <RadioGroupItem
 *     value="option1"
 *     label="Option 1"
 *     controlPlacement="end"
 *   />
 * </RadioGroup>
 * ```
 */
const RadioGroupItem = ({
  ref,
  // Drop className from props to restrict overrides (children is not in props due to Omit)
  variant: variantProp,
  // Label props
  label,
  required,
  optional,
  icon,
  badge,
  tooltip,
  description,
  // RadioGroupItem props
  controlPlacement = "start",
  disabled,
  ...props
}: RadioGroupItemProps & {
  ref?: React.RefObject<ComponentRef<typeof RadioGroupPrimitive.Item> | null>;
}) => {
  const radioId = React.useId();
  const context = React.use(RadioGroupContext);
  const variant = variantProp ?? context.variant ?? "default";

  // Use internal styling only, ignoring any passed className
  const radioElement = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={radioId}
      className={cn(radioIndicatorVariants({ variant }))}
      disabled={disabled}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="absolute inset-0 flex items-center justify-center">
        <div className="size-2 rounded-full bg-primary-foreground group-focus/radio:!bg-primary group-focus-visible/radio:!bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  // If no label is provided, return just the radio element
  if (!label) {
    return radioElement;
  }

  return (
    <div
      className={cn(
        radioItemWrapperVariants({ variant, controlPlacement }),
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        disabled && "opacity-70",
      )}
      onClick={(e) => {
        // For box variant, allow clicking anywhere in the box to select
        if (
          !disabled &&
          variant === "box" &&
          e.target instanceof Element &&
          // Don't trigger if clicking the radio itself or the label (which has htmlFor)
          !e.target.closest('[role="radio"]') &&
          !e.target.closest("label")
        ) {
          document.getElementById(radioId)?.click();
        }
      }}
    >
      <div className="flex h-5 items-center">{radioElement}</div>
      <Label
        label={label}
        htmlFor={radioId}
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

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
