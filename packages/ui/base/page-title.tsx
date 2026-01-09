import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
// update after button is updated
// import { Button, type ButtonProps } from "./button";
import { Separator } from "./separator";

const pageTitleVariants = cva("flex flex-col gap-6", {
  variants: {
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

interface PageTitleProps
  extends Omit<React.ComponentProps<"div">, "className">,
    VariantProps<typeof pageTitleVariants> {
  title: string;
  subtitle?: string;
  //   primaryAction?: ButtonProps;
  //   secondaryAction?: ButtonProps;
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
  //   primaryAction,
  //   secondaryAction,
  separator = true,
  align,
  ...props
}: PageTitleProps) {
  return (
    <div
      className={pageTitleVariants({ align })}
      data-slot="page-title"
      {...props}
    >
      <div className="flex w-full items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {/* {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2">
            {secondaryAction && (
              <Button variant="outline" {...secondaryAction} />
            )}
            {primaryAction && <Button variant="default" {...primaryAction} />}
          </div>
        )} */}
      </div>
      {separator && <Separator />}
    </div>
  );
}

export { PageTitle, type PageTitleProps };
