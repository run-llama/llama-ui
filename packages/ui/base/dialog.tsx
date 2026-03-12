import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";
import type { AnalyticsProps } from "../types/analytics";

/**
 * Dialog - A modal dialog component for user interactions and confirmations.
 *
 * Composition:
 * - `Dialog` - Root component from Radix UI
 * - `DialogTrigger` - Opens the dialog when clicked
 * - `DialogContent` - Container for dialog content (use breakpoint prop for responsive layout)
 * - `DialogHeader` - Header section with title, description, and optional icon
 * - `DialogFooter` - Footer section with action buttons (primary, secondary, tertiary)
 * - `DialogClose` - Close button trigger
 *
 * Breakpoints:
 * - `"lg"` - Large layout with tertiary left, secondary/primary right
 * - `"sm"` - Small layout with stacked buttons and centered text
 *
 * Example:
 * ```tsx
 * <Dialog>
 *   <DialogTrigger asChild>
 *     <Button label="Open Dialog" />
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader
 *       title="Confirm action"
 *       description="Are you sure?"
 *     />
 *     <DialogFooter
 *       primary={{ label: "Confirm", onClick: onConfirm }}
 *       secondary={{ label: "Cancel" }}
 *     />
 *   </DialogContent>
 * </Dialog>
 * ```
 */

type DialogBreakpoint = "lg" | "sm";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
  ref?: React.RefObject<React.ComponentRef<
    typeof DialogPrimitive.Overlay
  > | null>;
}) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
      className
    )}
    {...props}
  />
);
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  ref?: React.RefObject<React.ComponentRef<
    typeof DialogPrimitive.Content
  > | null>;
  /** Responsive breakpoint for the dialog layout (default: "lg") */
  breakpoint?: DialogBreakpoint;
}

const DialogContent = ({
  ref,
  className,
  children,
  breakpoint = "lg",
  ...props
}: DialogContentProps) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-1/2 top-1/2 z-50 flex w-full max-w-[425px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border bg-background p-6 shadow-lg",
        className
      )}
      data-breakpoint={breakpoint}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="rounded-xs absolute right-[15px] top-[15px] opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

/* -------------------------------------------------------------------------- */
/*                                  Header                                    */
/* -------------------------------------------------------------------------- */

export interface DialogHeaderProps extends AnalyticsProps {
  /** Main heading text */
  title?: React.ReactNode;
  /** Descriptive text below the title */
  description?: React.ReactNode;
  /** Icon to display at the top of the header */
  icon?: React.ReactNode;
  /** Responsive breakpoint for layout (default: "lg") */
  breakpoint?: DialogBreakpoint;
}

const DialogHeader = ({
  title,
  description,
  icon,
  breakpoint = "lg",
  "da-cid": cid,
}: DialogHeaderProps) => {
  if (!title && !description && !icon) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        breakpoint === "sm" && "text-center"
      )}
      da-cid={cid}
    >
      {icon && (
        <div
          className={cn(
            "shadow-xs flex size-8 items-center justify-center rounded-sm border bg-background p-2 [&_svg]:size-4",
            breakpoint === "sm" && "mx-auto"
          )}
        >
          {icon}
        </div>
      )}
      {(title || description) && (
        <div className="flex flex-col gap-1.5">
          {title && (
            <DialogPrimitive.Title className="text-lg font-semibold leading-none text-foreground">
              {title}
            </DialogPrimitive.Title>
          )}
          {description && (
            <DialogPrimitive.Description className="text-sm leading-5 text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
      )}
    </div>
  );
};
DialogHeader.displayName = "DialogHeader";

/* -------------------------------------------------------------------------- */
/*                                  Footer                                    */
/* -------------------------------------------------------------------------- */

export type DialogAction = {
  /** Label text displayed on the button */
  label: string;
  /** Optional icon to display in the button */
  icon?: React.ReactNode;
  /** Callback function when button is clicked */
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Visual style of the button */
  isDestructive?: boolean;
  /** When true, clicking the button will close the dialog */
  asDialogClose?: boolean;
  /** Button type - use "submit" for form submission */
  type?: "button" | "submit";
  /** Form ID to associate with submit button (used with type="submit") */
  form?: string;
};

export interface DialogFooterProps extends AnalyticsProps {
  /** Primary call-to-action button (displayed rightmost on both lg and sm breakpoints) */
  primary?: DialogAction;
  /** Secondary action button (displayed between primary and tertiary on lg, left of primary on sm) */
  secondary?: DialogAction;
  /** Tertiary action button (displayed leftmost on lg, below primary/secondary on sm) */
  tertiary?: DialogAction;
  /** Responsive breakpoint for layout (default: "lg") */
  breakpoint?: DialogBreakpoint;
  /** Custom content to render before the action buttons */
  children?: React.ReactNode;
}

/** Helper to render a dialog action button with optional DialogClose wrapper */
const renderActionButton = (
  action: DialogAction,
  variant: "default" | "outline" | "ghost" | "destructive",
  fullWidth?: boolean
) => {
  const button = (
    <Button
      fullWidth={fullWidth}
      variant={action.isDestructive ? "destructive" : variant}
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      label={action.label}
      startIcon={action.icon}
      type={action.type}
      form={action.form}
      isLoading={action.loading}
    />
  );

  if (action.asDialogClose) {
    return <DialogClose asChild>{button}</DialogClose>;
  }

  return button;
};

const DialogFooter = ({
  primary,
  secondary,
  tertiary,
  breakpoint = "lg",
  children,
  "da-cid": cid,
}: DialogFooterProps) => {
  if (!primary && !secondary && !tertiary && !children) return null;

  // Large breakpoint: Tertiary left, Secondary + Primary right
  if (breakpoint === "lg") {
    return (
      <div className="flex flex-col gap-6" da-cid={cid}>
        {children}
        {(primary || secondary || tertiary) && (
          <div className="flex items-center gap-6">
            {tertiary && renderActionButton(tertiary, "ghost")}
            <div className="flex flex-1 items-center justify-end gap-2">
              {secondary && renderActionButton(secondary, "outline")}
              {primary && renderActionButton(primary, "default")}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Small breakpoint: Stacked layout with Secondary + Primary in a row, Tertiary below
  return (
    <div className="flex flex-col gap-6" da-cid={cid}>
      {children}
      {(primary || secondary || tertiary) && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex w-full items-center gap-2">
            {secondary && (
              <div className="flex-1">
                {renderActionButton(secondary, "outline", true)}
              </div>
            )}
            {primary && (
              <div className="flex-1">
                {renderActionButton(primary, "default", true)}
              </div>
            )}
          </div>
          {tertiary && renderActionButton(tertiary, "ghost")}
        </div>
      )}
    </div>
  );
};
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTrigger,
};

export type { DialogBreakpoint };
