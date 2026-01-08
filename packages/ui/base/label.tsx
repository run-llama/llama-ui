import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleHelp } from "lucide-react";
//TODO replace with tooltip after swap
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const labelContainerVariants = cva("flex flex-col gap-3 w-full", {
  variants: {
    variant: {
      integrated: "",
      standalone: "",
    },
  },
  defaultVariants: {
    variant: "integrated",
  },
});

export interface LabelProps
  extends VariantProps<typeof labelContainerVariants> {
  /** Main label text (required) */
  label: string;
  /** Show red asterisk to indicate required field */
  required?: boolean;
  /** Show "Optional" text after the label */
  optional?: boolean;
  /** Icon to display before the label */
  icon?: React.ReactNode;
  /** Badge to display next to the label */
  badge?: React.ReactNode;
  /** Tooltip content (shows info icon on hover) */
  tooltip?: React.ReactNode;
  /** Helper text displayed below the label */
  description?: string;
  /** Child elements to render (used in "integrated" variant) */
  children?: React.ReactNode;
  /** HTML id for form field association */
  htmlFor?: string;
  /**
   * Variant styling:
   * - "integrated" - Standard label with built-in spacing
   * - "standalone" - Label without automatic child rendering
   */
}

/**
 * Label - A flexible label component for form fields.
 *
 * Features:
 * - Icon support for visual indicators
 * - Required/Optional indicators
 * - Badge for additional info (ReactNode, e.g., Badge component with icon)
 * - Tooltip support with help icon
 * - Description text for helper content
 * - Two variants: integrated and standalone
 *
 * Example:
 * ```tsx
 * <Label
 *   label="Email"
 *   required
 *   description="We'll never share your email"
 *   tooltip="Standard email format required"
 *   icon={<Mail />}
 * />
 *
 * // With badge
 * <Label
 *   label="New Feature"
 *   badge={<Badge variant="outline" label="Beta" icon={<Sparkles />} />}
 * />
 *
 * // With checkbox
 * <Label label="Agree to terms" required>
 *   <Checkbox />
 * </Label>
 * ```
 */
const Label = ({
  label,
  required = false,
  optional = false,
  icon,
  badge,
  tooltip,
  description,
  children,
  variant = "integrated",
  htmlFor,
}: LabelProps) => {
  return (
    <div className={labelContainerVariants({ variant })}>
      <div className="flex flex-col gap-1">
        <div className="flex min-h-5 w-full items-center gap-2">
          {icon && (
            <div className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-full">
              {icon}
            </div>
          )}
          <label
            htmlFor={htmlFor}
            className="flex shrink-0 items-center text-sm font-medium"
          >
            <span className="text-foreground">{label}</span>
            {required && <span className="text-[rgb(225,29,72)]">*</span>}
          </label>
          {optional && (
            <span className="shrink-0 text-sm font-normal text-muted-foreground">
              Optional
            </span>
          )}
          {badge}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex size-4 shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground [&>svg]:size-full">
                  <CircleHelp />
                </div>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {description && (
          <p className="w-full whitespace-pre-wrap text-sm font-normal text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {variant === "integrated" && children}
    </div>
  );
};

Label.displayName = "Label";

export { Label, labelContainerVariants };
