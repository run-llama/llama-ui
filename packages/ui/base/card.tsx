import * as React from "react";

import { Button, type ButtonProps } from "./button";
import { cn } from "../lib/utils";

/**
 * Card - A container component for grouping related content.
 *
 * Composition:
 * - `Card` - Main container with rounded border and shadow
 * - `CardHeader` - Top section with optional icon, title, and description
 * - `CardTitle` - Heading element within CardHeader
 * - `CardDescription` - Subheading or descriptive text
 * - `CardContent` - Main content area
 * - `CardFooter` - Bottom section for actions (primary, secondary, tertiary buttons)
 *
 * Example:
 * ```tsx
 * <Card>
 *   <CardHeader
 *     icon={<Mail />}
 *     title="Contact Us"
 *     description="Get in touch with our team"
 *   />
 *   <CardContent>Your content here</CardContent>
 *   <CardFooter
 *     primaryAction={<Button label="Send" />}
 *     secondaryAction={<Button variant="outline" label="Cancel" />}
 *   />
 * </Card>
 * ```
 */
const Card = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-6 rounded-xl border bg-card px-6 py-6 text-card-foreground shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]",
      className
    )}
    {...props}
  />
);
Card.displayName = "Card";

const CardTitle = ({
  ref,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  ref?: React.RefObject<HTMLParagraphElement | null>;
}) => (
  <h3
    ref={ref}
    className="text-base font-semibold leading-none text-card-foreground"
    {...props}
  />
);
CardTitle.displayName = "CardTitle";

const CardDescription = ({
  ref,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  ref?: React.RefObject<HTMLParagraphElement | null>;
}) => (
  <p ref={ref} className="text-sm leading-5 text-muted-foreground" {...props} />
);
CardDescription.displayName = "CardDescription";

/**
 * CardHeader Props
 * - `icon` - Optional icon to display in the header
 * - `title` - Main heading text
 * - `description` - Secondary descriptive text
 */
interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  ref?: React.RefObject<HTMLDivElement | null>;
  /** Icon component to display at the top of the header */
  icon?: React.ReactNode;
  /** Main heading text */
  title?: React.ReactNode;
  /** Secondary descriptive text below the title */
  description?: React.ReactNode;
  /** Action button to display in the header. Defaults to "sm", but allows "icon-sm" for icon-only buttons. */
  action?: Omit<ButtonProps, "size"> & { size?: "sm" | "icon-sm" };
}

const CardHeader = ({
  ref,
  icon,
  title,
  description,
  action,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className,
  ...props
}: CardHeaderProps) => (
  <div ref={ref} className="flex flex-col gap-4" {...props}>
    <div className="flex w-full items-start justify-between gap-3">
      <div className="flex w-full flex-col gap-4">
        {icon && (
          <div className="flex w-fit items-center justify-center overflow-clip rounded-sm border border-border bg-background p-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] [&_svg]:size-4">
            {icon}
          </div>
        )}
        {(title || description) && (
          <div className="flex flex-col gap-1.5">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        )}
      </div>
      {action && (
        <div className="shrink-0">
          <Button size="sm" {...action} />
        </div>
      )}
    </div>
  </div>
);
CardHeader.displayName = "CardHeader";

const CardContent = ({
  ref,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => <div ref={ref} {...props} />;
CardContent.displayName = "CardContent";

/**
 * CardFooter Props
 * - `customContent` - Custom content to render before action buttons
 * - `primaryAction` - Main call-to-action button (displayed rightmost)
 * - `secondaryAction` - Secondary action button (displayed right of center)
 * - `tertiaryAction` - Tertiary action button (displayed leftmost)
 */
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.RefObject<HTMLDivElement | null>;
  /** Custom content to render before the action buttons */
  customContent?: React.ReactNode;
  /** Primary call-to-action button (displayed rightmost) */
  primaryAction?: React.ReactNode;
  /** Secondary action button (displayed between primary and tertiary) */
  secondaryAction?: React.ReactNode;
  /** Tertiary action button (displayed leftmost) */
  tertiaryAction?: React.ReactNode;
}

const CardFooter = ({
  ref,
  customContent,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className,
  ...props
}: CardFooterProps) => (
  <div ref={ref} className="flex flex-col gap-6" {...props}>
    {customContent}
    {(primaryAction || secondaryAction || tertiaryAction) && (
      <div className="flex w-full items-center gap-4">
        {tertiaryAction}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-1 items-center justify-end gap-2">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    )}
  </div>
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
