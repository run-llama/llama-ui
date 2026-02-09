import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Info, OctagonAlert, TriangleAlert } from "lucide-react";

import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";
import type { AnalyticsProps } from "../types/analytics";

const alertVariants = cva(
  "relative w-full rounded-lg border bg-card px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default:
          "text-foreground [&_[data-slot=alert-description]]:text-muted-foreground",
        error:
          "text-destructive [&_[data-slot=alert-description]]:text-destructive",
        warning: "text-warning [&_[data-slot=alert-description]]:text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const variantIcons = {
  default: Info,
  error: OctagonAlert,
  warning: TriangleAlert,
} as const;

export interface AlertProps
  extends AnalyticsProps,
    VariantProps<typeof alertVariants> {
  /** The title text displayed prominently in the alert */
  title: string;
  /** Optional description text displayed below the title */
  description?: string;
  /** Whether to show the variant-specific icon (default: true) */
  showIcon?: boolean;
  /** If provided, displays an action button with this label */
  buttonLabel?: string;
  /** Callback fired when the action button is clicked */
  onButtonClick?: () => void;
  /** The variant style for the action button (default: "default") */
  buttonVariant?: ButtonProps["variant"];
}

/**
 * Alert - A strict, opinionated Alert component for the LlamaCloud design system.
 *
 * Key differences from base Shadcn Alert:
 * - No arbitrary children - uses explicit `title` and `description` props
 * - Predefined icons per variant (Info, OctagonAlert, TriangleAlert)
 * - New "warning" variant in addition to default and error
 * - Optional action button with controlled styling
 */
function Alert({
  variant = "default",
  title,
  description,
  showIcon = true,
  buttonLabel,
  onButtonClick,
  buttonVariant = "outline",
  "da-cid": cid,
}: AlertProps) {
  const Icon = variantIcons[variant ?? "default"];

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), "flex items-center gap-3")}
      da-cid={cid}
    >
      <div className="flex flex-1 items-start gap-3">
        {showIcon && (
          <div className="flex shrink-0 pt-0.5">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p
            data-slot="alert-title"
            className="truncate text-sm font-medium leading-5"
          >
            {title}
          </p>
          {description && (
            <p
              data-slot="alert-description"
              className="whitespace-pre-line text-sm font-normal leading-5"
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {buttonLabel && (
        <div className="shrink-0 text-foreground">
          <Button
            variant={buttonVariant}
            size="sm"
            onClick={onButtonClick}
            label={buttonLabel}
          />
        </div>
      )}
    </div>
  );
}

export { Alert, alertVariants };
