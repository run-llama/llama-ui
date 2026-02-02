import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 active:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        destructive:
          "border bg-background text-destructive shadow-xs hover:bg-accent hover:text-destructive focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      },
      size: {
        default: "h-9 px-3 py-2 gap-1.5",
        sm: "h-8 rounded-md gap-1.5 px-2",
        icon: "size-9",
        "icon-sm": "size-8",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<React.ComponentProps<"button">, "className" | "children">,
    VariantProps<typeof buttonVariants> {
  label?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * Button - A strict button component for user interactions.
 *
 * Variants:
 * - `default` - Primary button with solid background
 * - `destructive` - For delete or dangerous actions
 * - `outline` - Bordered button without background fill
 * - `ghost` - Minimal button without background or border
 * - `link` - Styled as a text link
 *
 * Sizes:
 * - `default` - Standard button height (h-9)
 * - `sm` - Smaller button (h-8)
 * - `icon` - Square button for icons (size-9)
 * - `icon-sm` - Small square icon button (size-8)
 *
 * Props:
 * - `label` - Button text content (optional)
 * - `startIcon` - Icon to display before the label
 * - `endIcon` - Icon to display after the label
 * - `isLoading` - Shows a loading spinner and disables the button
 * - `disabled` - Whether the button is disabled (default: false)
 * - `fullWidth` - Whether the button should take up the full width of its container
 * - `variant` - Visual style (default: "default")
 * - `size` - Button size (default: "default")
 * - All standard HTML button attributes (except className and children)
 *
 * Example:
 * ```tsx
 * <Button label="Click me" />
 * <Button variant="destructive" size="sm" label="Delete" startIcon={<Trash2 />} />
 * <Button label="Saving..." isLoading />
 * <Button label="Disabled" disabled />
 * <Button size="icon" startIcon={<Plus />} aria-label="Add" />
 * <Button label="Full Width" fullWidth />
 * ```
 */
function Button({
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
}: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }))}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : startIcon}
      {label && (
        <span
          className={cn(
            size === "icon" || size === "icon-sm" ? "sr-only" : undefined
          )}
        >
          {label}
        </span>
      )}
      {!isLoading && endIcon}
    </button>
  );
}

export { Button, buttonVariants };
