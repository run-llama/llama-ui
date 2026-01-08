import * as React from "react";
import type { ComponentRef } from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { Label, type LabelProps } from "./label";

const switchRootVariants = cva(
  [
    "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=unchecked]:bg-input",
    "data-[state=checked]:bg-primary",
    // Focus state - ring border and focus ring shadow
    "focus-visible:outline-none focus-visible:border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
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
  },
);

const switchThumbVariants = cva(
  "pointer-events-none block size-4 rounded-full bg-background transition-transform data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-4 shadow-lg",
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
  },
);

const switchWrapperVariants = cva("inline-flex items-start gap-3", {
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

type SwitchLabelProps = Omit<LabelProps, "children" | "variant" | "htmlFor">;

export interface SwitchProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
      "asChild" | "children" | "className"
    >,
    VariantProps<typeof switchRootVariants>,
    Partial<SwitchLabelProps> {
  /** Position of the switch control relative to label ("start" | "end", default: "start") */
  controlPlacement?: "start" | "end";
}

type SwitchGroupContextValue = {
  variant?: "default" | "box" | null;
};

const SwitchGroupContext = React.createContext<SwitchGroupContextValue>({});

export interface SwitchGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> {
  variant?: "default" | "box";
  children?: React.ReactNode;
}

const SwitchGroup = ({
  ref,
  variant,
  children,
}: SwitchGroupProps & {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => {
  return (
    // eslint-disable-next-line @eslint-react/no-unstable-context-value
    <SwitchGroupContext value={{ variant }}>
      <div ref={ref} className="grid gap-3">
        {children}
      </div>
    </SwitchGroupContext>
  );
};
SwitchGroup.displayName = "SwitchGroup";

/**
 * Switch - A toggle/checkbox component with optional label support.
 *
 * Variants:
 * - `default` - Standard toggle switch
 * - `box` - Card-style switch with border and background
 *
 * Label Props (all optional):
 * - `label` - Main label text (if not provided, returns switch only)
 * - `description` - Helper text below the label
 * - `icon` - Icon displayed before the label
 * - `badge` - Badge text displayed next to the label
 * - `tooltip` - Tooltip content (shows info icon)
 * - `required` - Shows red asterisk
 * - `optional` - Shows "Optional" text
 *
 * Props:
 * - `controlPlacement` - Position relative to label: "start" (default) or "end"
 * - `variant` - Visual style: "default" or "box"
 * - All standard HTML attributes for input[type="checkbox"]
 *
 * Example:
 * ```tsx
 * <Switch label="Enable notifications" />
 * <Switch
 *   variant="box"
 *   label="Email digest"
 *   description="Send weekly email digests"
 *   controlPlacement="end"
 *   defaultChecked
 * />
 * ```
 */
const Switch = ({
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
  // Switch props
  controlPlacement = "start",
  disabled,
  ...props
}: SwitchProps & {
  ref?: React.RefObject<ComponentRef<typeof SwitchPrimitives.Root> | null>;
}) => {
  const switchId = React.useId();
  const id = props.id || switchId;
  const context = React.use(SwitchGroupContext);
  const variant = variantProp ?? context.variant ?? "default";

  const switchElement = (
    <SwitchPrimitives.Root
      ref={ref}
      id={id}
      className={switchRootVariants({ variant })}
      disabled={disabled}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(switchThumbVariants({ variant }))}
      />
    </SwitchPrimitives.Root>
  );

  if (!label && !description) {
    return switchElement;
  }

  return (
    <div
      className={cn(
        switchWrapperVariants({ variant, controlPlacement }),
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        disabled && "opacity-70",
      )}
      onClick={(e) => {
        // For box variant, allow clicking anywhere in the box to toggle
        if (
          !disabled &&
          variant === "box" &&
          e.target instanceof Element &&
          // Don't trigger if clicking the switch itself or the label (which has htmlFor)
          !e.target.closest('[role="switch"]') &&
          !e.target.closest("label")
        ) {
          document.getElementById(id)?.click();
        }
      }}
    >
      <div className="flex h-5 items-center">{switchElement}</div>
      <Label
        label={label || ""}
        htmlFor={id}
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

Switch.displayName = "Switch";

export { Switch, SwitchGroup };
