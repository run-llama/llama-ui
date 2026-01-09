import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon, Info } from "lucide-react";

import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";
import { Badge } from "./badge";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

export interface AccordionTriggerProps
  extends Omit<
    React.ComponentProps<typeof AccordionPrimitive.Trigger>,
    "children" | "className"
  > {
  /** The main title text displayed prominently */
  title: string;
  /** Optional secondary text (caption) displayed next to the title */
  caption?: string;
  /** Optional icon component to display at the start of the trigger */
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether to show the tooltip info icon */
  showTooltip?: boolean;
  /** Content to display in the tooltip when showTooltip is true */
  tooltipContent?: string;
  /** Optional badge to display before the chevron */
  badge?: React.ReactNode;
}

/**
 * AccordionTrigger - An opinionated accordion trigger component matching the LlamaCloud design system.
 *
 * Key differences from base Shadcn AccordionTrigger:
 * - Uses explicit `title` and `caption` props instead of arbitrary children
 * - Supports optional icon, tooltip, and badge elements
 * - Fixed internal structure (icon → title/caption → tooltip → badge → chevron)
 * - Styling matches design system states (hover, focus, pressed)
 */
function AccordionTrigger({
  title,
  caption,
  icon: Icon,
  showTooltip = false,
  tooltipContent,
  badge,
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 rounded-md px-0 py-4 text-left outline-none transition-all",
          "focus-visible:ring-ring/50 focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-offset-0",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&[data-state=open]>div:last-child>svg]:rotate-180",
          "[&:active_.accordion-trigger-text>span]:opacity-60",
          "[&:active>div:last-child>svg]:opacity-60"
        )}
        {...props}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon && (
            <div className="flex shrink-0">
              <Icon className="text-foreground size-4" aria-hidden="true" />
            </div>
          )}
          <div className="accordion-trigger-text flex min-w-0 items-baseline gap-2">
            <span className="text-foreground truncate text-sm font-medium leading-5 hover:underline">
              {title}
            </span>
            {caption && (
              <span className="text-muted-foreground shrink-0 text-sm font-normal leading-5">
                {caption}
              </span>
            )}
          </div>
          {showTooltip && (
            <div className="flex shrink-0">
              {/* TODO: Add tooltip component */}
              {/* {tooltipContent ? (
                <Tooltip
                  trigger={
                    <button
                      type="button"
                      className="focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground flex size-4 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-[2px] focus-visible:ring-offset-0"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="More information"
                    >
                      <Info className="size-3.5" aria-hidden="true" />
                    </button>
                  }
                  content={tooltipContent}
                  sideOffset={4}
                />
              ) : (
                <Info
                  className="text-muted-foreground size-3.5"
                  aria-hidden="true"
                />
              )} */}
            </div>
          )}
          {badge && (
            <div className="flex shrink-0">
              {/* TODO: Add badge component */}
              {/* {typeof badge === "string" ? (
                <Badge variant="secondary" label={badge} />
              ) : (
                badge
              )} */}
            </div>
          )}
        </div>
        <div className="flex shrink-0">
          <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200" />
        </div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("text-foreground pb-4 pt-0", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
