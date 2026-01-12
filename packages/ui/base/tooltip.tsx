"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ExternalLink } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

/**
 * Tooltip - A hover-triggered contextual information component.
 *
 * Features:
 * - Customizable delay duration
 * - Directional positioning (top, bottom, left, right)
 * - Optional link with external icon indicator
 * - Arrow indicator pointing to trigger
 *
 * Example:
 * ```tsx
 * <Tooltip
 *   trigger={<Button variant="outline" label="Hover me" />}
 *   content="Helpful information"
 * />
 *
 * // With link
 * <Tooltip
 *   trigger={<HelpIcon />}
 *   content="Click the link below for more information"
 *   link="https://docs.example.com"
 *   linkLabel="Learn more"
 *   linkExternal={true}
 * />
 * ```
 */

const TooltipProviderComponent = TooltipPrimitive.Provider;

const TooltipProvider = ({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
  <TooltipProviderComponent
    data-slot="tooltip-provider"
    delayDuration={delayDuration}
    {...props}
  />
);

type TooltipProps = Omit<
  React.ComponentProps<typeof TooltipPrimitive.Root>,
  "children" | "className"
> & {
  /** The element that triggers the tooltip on hover/focus */
  trigger: React.ReactElement;
  /** The main content of the tooltip (editable) */
  content: React.ReactNode;
  /** Side of the trigger to show the tooltip */
  side?: "top" | "bottom" | "left" | "right";
  /** URL for the link (if provided, link will be shown) */
  link?: string;
  /** Whether the link is external (shows external icon if true) */
  linkExternal?: boolean;
  /** Label text for the link */
  linkLabel?: string;
  /** Delay duration in milliseconds */
  delayDuration?: number;
  /** Offset from the trigger */
  sideOffset?: number;
};

const Tooltip = ({
  trigger,
  content,
  side,
  link,
  linkExternal = false,
  linkLabel,
  delayDuration = 0,
  sideOffset = 6,
  ...props
}: TooltipProps) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root data-slot="tooltip" {...props}>
        <TooltipPrimitive.Trigger asChild data-slot="tooltip-trigger">
          {trigger}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            data-slot="tooltip-content"
            side={side}
            sideOffset={sideOffset}
            className={cn(
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              "z-50 flex max-w-xs flex-col items-center gap-1 rounded-md bg-foreground px-3 py-2 text-center text-xs text-background",
            )}
          >
            {content}
            {link && (
              <a
                href={link}
                target={linkExternal ? "_blank" : undefined}
                rel={linkExternal ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1 text-xs font-medium text-background underline"
              >
                {linkLabel ?? "Link"}
                {linkExternal && <ExternalLink className="size-3" />}
              </a>
            )}
            <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
};

export { Tooltip, TooltipProvider };
