import * as React from "react";

import { Button, type ButtonProps } from "./button";
import type { AnalyticsProps } from "../types/analytics";

interface SectionTitleProps
  extends Omit<React.ComponentProps<"div">, "className">,
    AnalyticsProps {
  title: string;
  subtitle?: string;
  primaryAction?: ButtonProps;
  secondaryAction?: ButtonProps;
}

/**
 * SectionTitle - A strict component for section headers.
 *
 * Features:
 * - Enforces consistent spacing and typography for sections
 * - Supports primary and secondary actions scoped to the section
 * - Optional subtitle
 *
 * Props:
 * - `title`: The main heading of the section.
 * - `subtitle`: Optional description or context.
 * - `primaryAction`: Props for the primary call-to-action button.
 * - `secondaryAction`: Props for the secondary action button.
 */
function SectionTitle({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  "da-cid": cid,
  ...props
}: SectionTitleProps) {
  return (
    <div
      className="flex flex-col gap-6"
      data-slot="section-title"
      da-cid={cid}
      {...props}
    >
      <div className="flex w-full items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium leading-none text-foreground">
            {title}
          </h2>
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
    </div>
  );
}

export { SectionTitle, type SectionTitleProps };
