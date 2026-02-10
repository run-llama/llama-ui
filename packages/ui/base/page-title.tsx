import * as React from "react";

import { Button, type ButtonProps } from "./button";
import { Separator } from "./separator";
import type { AnalyticsProps } from "../types/analytics";

interface PageTitleProps
  extends Omit<React.ComponentProps<"div">, "className">,
    AnalyticsProps {
  title: string;
  subtitle?: string;
  primaryAction?: ButtonProps;
  secondaryAction?: ButtonProps;
  separator?: boolean;
}

/**
 * PageTitle - A strict component for page headers.
 *
 * Features:
 * - Enforces consistent spacing and typography
 * - Supports primary and secondary actions
 * - Optional subtitle and separator
 *
 * Props:
 * - `title`: The main heading of the page.
 * - `subtitle`: Optional description or context.
 * - `primaryAction`: Props for the primary call-to-action button.
 * - `secondaryAction`: Props for the secondary action button.
 * - `separator`: Whether to show a divider line at the bottom (default: true).
 */
function PageTitle({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  separator = true,
  ...props
}: PageTitleProps) {
  return (
    <div className="flex flex-col gap-6" data-slot="page-title" {...props}>
      <div className="flex w-full items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2">
            {secondaryAction && (
              <Button variant="outline" {...secondaryAction} />
            )}
            {primaryAction && <Button variant="default" {...primaryAction} />}
          </div>
        )}
      </div>
      {separator && <Separator />}
    </div>
  );
}

export { PageTitle, type PageTitleProps };
