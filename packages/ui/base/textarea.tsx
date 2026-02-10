import { cva, type VariantProps } from "class-variance-authority";
import TextareaAutosize from "react-textarea-autosize";

import { cn } from "../lib/utils";

const textareaVariants = cva(
  [
    "flex w-full resize-none rounded-md border border-input bg-background px-3 py-[6.5px] text-sm leading-normal shadow-xs transition-colors",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
  ],
  {
    variants: {
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextareaProps
  extends Omit<
      React.ComponentProps<typeof TextareaAutosize>,
      "className" | "children"
    >,
    VariantProps<typeof textareaVariants> {}

/**
 * Textarea - A styled multi-line text input component.
 *
 * Features:
 * - Auto-grows height with content using react-textarea-autosize
 * - Accessible focus and error states
 * - Configurable min/max rows
 *
 * Special Handling:
 * - Invalid inputs (aria-invalid) or "error" variant show destructive ring color
 * - Height auto-grows with content, respecting minRows/maxRows constraints
 *
 * Example:
 * ```tsx
 * <Textarea placeholder="Enter description" />
 * <Textarea variant="error" placeholder="Invalid input" />
 * <Textarea minRows={2} maxRows={6} placeholder="Auto-growing textarea" />
 * ```
 */
const Textarea = ({
  ref,
  variant,
  minRows = 2,
  maxRows,
  ...props
}: TextareaProps) => {
  return (
    <TextareaAutosize
      className={cn(
        textareaVariants({ variant }),
        maxRows && "overflow-y-auto"
      )}
      ref={ref}
      minRows={minRows}
      maxRows={maxRows}
      {...props}
    />
  );
};

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
