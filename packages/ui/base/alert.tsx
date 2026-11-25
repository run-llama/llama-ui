import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Info, OctagonAlert, TriangleAlert } from "lucide-react";

import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";
import type { EmptyActionProps } from "./empty";
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
  }
);

const variantIcons = {
  default: Info,
  error: OctagonAlert,
  warning: TriangleAlert,
} as const;

/** An action button on an `Alert`. Same shape as `Empty`'s actions. */
type AlertActionProps = EmptyActionProps;

export interface AlertProps
  extends AnalyticsProps,
    VariantProps<typeof alertVariants> {
  /** The title text displayed prominently in the alert */
  title: string;
  /** Optional description text displayed below the title */
  description?: string;
  /** Whether to show the variant-specific icon (default: true) */
  showIcon?: boolean;
  /** The main action, a solid button. Rightmost in a row, on top when the actions stack. */
  primaryAction?: AlertActionProps;
  /** An outline button, left of the primary action */
  secondaryAction?: AlertActionProps;
  /** A low-emphasis ghost button, leftmost in a row, last when the actions stack */
  tertiaryAction?: AlertActionProps;
  /**
   * If provided, displays an action button with this label. Prefer the
   * action props. Ignored when any action prop is set.
   */
  buttonLabel?: string;
  /** Callback fired when the `buttonLabel` button is clicked */
  onButtonClick?: () => void;
  /** The variant style for the `buttonLabel` button (default: "outline") */
  buttonVariant?: ButtonProps["variant"];
}

type AlertButton = AlertActionProps & { variant: ButtonProps["variant"] };

function alertButtons({
  primaryAction,
  secondaryAction,
  tertiaryAction,
  buttonLabel,
  onButtonClick,
  buttonVariant = "outline",
}: AlertProps): AlertButton[] {
  const actions = [
    primaryAction && { ...primaryAction, variant: "default" as const },
    secondaryAction && { ...secondaryAction, variant: "outline" as const },
    tertiaryAction && { ...tertiaryAction, variant: "ghost" as const },
  ].filter((action) => action !== undefined);
  if (actions.length > 0) return actions;
  return buttonLabel
    ? [{ label: buttonLabel, onClick: onButtonClick, variant: buttonVariant }]
    : [];
}

/**
 * Alert - A strict, opinionated Alert component for the LlamaCloud design system.
 *
 * Key differences from base Shadcn Alert:
 * - No arbitrary children - uses explicit `title` and `description` props
 * - Predefined icons per variant (Info, OctagonAlert, TriangleAlert)
 * - New "warning" variant in addition to default and error
 * - Up to three actions, `primaryAction`, `secondaryAction` and
 *   `tertiaryAction`, with the same shape as `Empty`'s. They sit right of the
 *   text, and move below it when the text would get narrower than 12rem.
 *
 * `buttonLabel`, `onButtonClick` and `buttonVariant` still render a single
 * button. Prefer the action props. When both are passed, the action props
 * win and the `buttonLabel` button is not rendered.
 *
 * Example:
 * ```tsx
 * <Alert
 *   variant="error"
 *   title="Your card was declined"
 *   primaryAction={{ label: "Use a different card", onClick: changeCard }}
 *   secondaryAction={{ label: "Try again with this card", onClick: retry }}
 *   tertiaryAction={{ label: "Turn off auto-reload", onClick: turnOff }}
 * />
 * ```
 */
function Alert(props: AlertProps) {
  const {
    variant = "default",
    title,
    description,
    showIcon = true,
    "da-cid": cid,
  } = props;
  const Icon = variantIcons[variant ?? "default"];
  const buttons = alertButtons(props);

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant }),
        "flex flex-wrap items-center gap-3"
      )}
      da-cid={cid}
    >
      <div className="flex min-w-0 grow basis-48 items-start gap-3">
        {showIcon && (
          <div className="flex shrink-0 pt-0.5">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p
            data-slot="alert-title"
            className="break-words text-sm font-medium leading-5"
          >
            {title}
          </p>
          {description && (
            <p
              data-slot="alert-description"
              className="whitespace-pre-line break-words text-sm font-normal leading-5"
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {buttons.length > 0 && (
        <div className="ml-auto flex flex-row-reverse flex-wrap gap-2 text-foreground *:flex-1">
          {buttons.map(({ label, onClick, icon, variant }) => (
            <Button
              key={label}
              variant={variant}
              size="sm"
              label={label}
              startIcon={icon}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { Alert, alertVariants, type AlertActionProps };
