"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "./badge";

/**
 * Select - A dropdown component for organizing content into separate views.
 *
 * Composition:
 * - `Select` - Root component
 * - `SelectTrigger` - Button that opens the dropdown with badge support
 * - `SelectValue` - Displays the selected value or placeholder
 * - `SelectContent` - Container for options
 * - `SelectGroup` - Groups related options
 * - `SelectLabel` - Label for a group
 * - `SelectItem` - Individual selectable option with icon, caption, and badge support
 * - `SelectSeparator` - Visual divider between items
 * - `SelectScrollUpButton` / `SelectScrollDownButton` - Scroll indicators
 *
 * Features:
 * - Explicit prop-based API for items (label, caption, icon, badge)
 * - Strict props-only API (no children or className customization)
 * - Opinionated layout matching LlamaCloud design system
 *
 * Example:
 * ```tsx
 * <Select>
 *   <SelectTrigger badge="New">
 *     <SelectValue placeholder="Select an option" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectGroup>
 *       <SelectLabel label="Group 1" />
 *       <SelectItem value="opt1" label="Option 1" caption="Secondary info" badge="Beta" />
 *       <SelectItem value="opt2" label="Option 2" icon={Bot} />
 *     </SelectGroup>
 *   </SelectContent>
 * </Select>
 * ```
 */

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    "className" | "children"
  > {
  ref?: React.RefObject<React.ComponentRef<
    typeof SelectPrimitive.Trigger
  > | null>;
  badge?: React.ReactNode;
  children: React.ReactElement<
    React.ComponentPropsWithoutRef<typeof SelectValue>
  >;
}

const SelectTrigger = ({
  ref,
  children,
  badge,
  ...props
}: SelectTriggerProps) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className="border-input bg-background hover:border-ring focus:ring-ring/50 focus:border-ring data-[placeholder]:text-muted-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-normal outline-none transition-all focus:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:overflow-ellipsis [&>span]:whitespace-nowrap"
    {...props}
  >
    <div className="flex items-center overflow-hidden">{children}</div>
    <div className="flex items-center gap-2 shrink-0">
      {badge && (
        <div className="flex shrink-0">
          {typeof badge === "string" ? (
            <Badge variant="secondary" label={badge} />
          ) : (
            badge
          )}
        </div>
      )}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </SelectPrimitive.Icon>
    </div>
  </SelectPrimitive.Trigger>
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = ({
  ref,
  ...props
}: Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>,
  "className"
> & {
  ref?: React.RefObject<React.ComponentRef<
    typeof SelectPrimitive.ScrollUpButton
  > | null>;
}) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className="flex cursor-default items-center justify-center py-1"
    {...props}
  >
    <ChevronUp className="size-[15px]" />
  </SelectPrimitive.ScrollUpButton>
);
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = ({
  ref,
  ...props
}: Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>,
  "className"
> & {
  ref?: React.RefObject<React.ComponentRef<
    typeof SelectPrimitive.ScrollDownButton
  > | null>;
}) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className="flex cursor-default items-center justify-center py-1"
    {...props}
  >
    <ChevronDown className="size-[15px]" />
  </SelectPrimitive.ScrollDownButton>
);
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = ({
  ref,
  children,
  position = "popper",
  ...props
}: Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
  "className"
> & {
  ref?: React.RefObject<React.ComponentRef<
    typeof SelectPrimitive.Content
  > | null>;
}) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={
        position === "popper"
          ? "border-border bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
          : "border-border bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md"
      }
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={
          position === "popper"
            ? "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] p-1"
            : "p-1"
        }
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

export interface SelectLabelProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>,
    "children" | "className"
  > {
  ref?: React.RefObject<React.ComponentRef<
    typeof SelectPrimitive.Label
  > | null>;
  label: string;
}

const SelectLabel = ({ ref, label, ...props }: SelectLabelProps) => (
  <SelectPrimitive.Label
    ref={ref}
    className="text-muted-foreground px-8 py-1.5 text-xs font-medium"
    {...props}
  >
    {label}
  </SelectPrimitive.Label>
);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export interface SelectItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
    "children" | "className"
  > {
  ref?: React.RefObject<React.ComponentRef<typeof SelectPrimitive.Item> | null>;
  label: string;
  caption?: string;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

const SelectItem = ({
  ref,
  label,
  caption,
  badge,
  icon: Icon,
  ...props
}: SelectItemProps) => (
  <SelectPrimitive.Item
    ref={ref}
    className="focus:bg-accent focus:text-accent-foreground group relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm font-normal outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    {...props}
  >
    <span className="absolute left-2 flex size-5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <div className="flex flex-1 items-center gap-2 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
        {caption && (
          <span className="text-muted-foreground truncate text-xs">
            {caption}
          </span>
        )}
      </div>
      {badge && (
        <div className="flex shrink-0">
          {typeof badge === "string" ? (
            <Badge variant="secondary" label={badge} />
          ) : (
            badge
          )}
        </div>
      )}
      {Icon && (
        <Icon
          className="text-muted-foreground group-focus:text-foreground size-4 shrink-0"
          aria-hidden="true"
        />
      )}
    </div>
  </SelectPrimitive.Item>
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = ({
  ref,
  ...props
}: Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>,
  "className"
> & {
  ref?: React.RefObject<React.ComponentRef<
    typeof SelectPrimitive.Separator
  > | null>;
}) => (
  <SelectPrimitive.Separator
    ref={ref}
    className="bg-muted -mx-1 my-1 h-px"
    {...props}
  />
);
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
