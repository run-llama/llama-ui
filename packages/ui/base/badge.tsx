import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive-foreground text-destructive [a&]:hover:bg-destructive-foreground/90 focus-visible:ring-destructive/20",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        warning:
          "border-transparent bg-warning-foreground text-warning [a&]:hover:bg-warning-foreground/90",
        success:
          "border-transparent bg-success-foreground text-success [a&]:hover:bg-success-foreground/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends Omit<React.ComponentProps<"span">, "children" | "className">,
    VariantProps<typeof badgeVariants> {
  /** When true, renders the badge as a Slot component for composability */
  asChild?: boolean;
  /** Optional icon to display before the label */
  icon?: React.ReactNode;
  /** The text label displayed in the badge */
  label: string;
}

/**
 * Badge - A compact label component for displaying status, tags, or metadata.
 *
 * Variants:
 * - `default` - Primary badge with default styling
 * - `secondary` - Secondary badge for less important information
 * - `destructive` - For error or warning states
 * - `outline` - Bordered badge without background fill
 * - `warning` - For warning or caution messages
 * - `success` - For positive or success states
 *
 * Props:
 * - `label` (required) - The text to display in the badge
 * - `icon` - Optional Lucide icon or ReactNode to display before the label
 * - `variant` - Choose the visual style (default: "default")
 * - `asChild` - Render as a Slot for advanced composition
 *
 * Example:
 * ```tsx
 * <Badge label="New" variant="success" icon={<Check />} />
 * <Badge label="Draft" variant="outline" />
 * ```
 */
function Badge({
  variant,
  asChild = false,
  icon,
  label,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp data-slot="badge" className={badgeVariants({ variant })} {...props}>
      {icon}
      {label}
    </Comp>
  );
}

export { Badge, badgeVariants };
