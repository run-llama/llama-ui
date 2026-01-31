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
 * - `SelectTrigger` - Button that opens the dropdown with badge support and placeholder
 * - `SelectContent` - Container for options
 * - `SelectGroup` - Groups related options
 * - `SelectLabel` - Label for a group
 * - `SelectItem` - Individual selectable option with icon, caption, and badge support
 * - `SelectSeparator` - Visual divider between items
 * - `SelectScrollUpButton` / `SelectScrollDownButton` - Scroll indicators
 *
 * Features:
 * - Explicit prop-based API for items (label, caption, icon, badge)
 * - Caption supports both strings and React nodes (for tooltips, etc.)
 * - Strict props-only API (no children or className customization)
 * - Opinionated layout matching LlamaCloud design system
 *
 * Example:
 * ```tsx
 * <Select>
 *   <SelectTrigger badge="New" placeholder="Select an option" />
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

export interface SelectItemContentProps {
  label: string;
  badge?: React.ReactNode;
  icon?: IconType;
}

const SelectItemContent = ({ label, badge, icon }: SelectItemContentProps) => (
  <span className="flex w-full items-center gap-2">
    <span className="flex-1 truncate">{label}</span>
    {badge && (
      <span className="flex shrink-0">
        {typeof badge === "string" ? (
          <Badge variant="secondary" label={badge} />
        ) : (
          badge
        )}
      </span>
    )}
    {getIcon(icon)}
  </span>
);

export interface SelectTriggerProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    "className" | "children"
  > {
  ref?: React.RefObject<React.ComponentRef<
    typeof SelectPrimitive.Trigger
  > | null>;
  badge?: React.ReactNode;
  placeholder?: string;
  value?: string;
  icon?: IconType;
}

const SelectTrigger = ({
  ref,
  placeholder,
  badge,
  value,
  icon,
  ...props
}: SelectTriggerProps) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className="focus:ring-ring/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none transition-all hover:border-ring focus:border-ring focus:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&>span]:line-clamp-1 [&>span]:overflow-ellipsis [&>span]:whitespace-nowrap"
    {...props}
  >
    <div className="flex flex-1 overflow-hidden text-left [&>span]:w-full">
      {value ? (
        <SelectValue placeholder={placeholder}>
          <SelectItemContent label={value} badge={badge} icon={icon} />
        </SelectValue>
      ) : (
        <SelectValue placeholder={placeholder} />
      )}
    </div>
    <div className="flex shrink-0 items-center gap-2">
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
          ? "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-80 relative max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
          : "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-80 relative max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
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
    className="px-8 py-1.5 text-xs font-medium text-muted-foreground"
    {...props}
  >
    {label}
  </SelectPrimitive.Label>
);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

type IconComponentType = React.ComponentType<{
  className?: string;
  "aria-hidden"?: string;
}>;
type IconType = IconComponentType | React.ReactNode;

export interface SelectItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
    "children" | "className"
  > {
  ref?: React.RefObject<React.ComponentRef<typeof SelectPrimitive.Item> | null>;
  label: string;
  caption?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: IconType;
}

const getIcon = (icon: IconType) => {
  if (!icon) {
    return null;
  }

  // React element (JSX like <svg>, <img>, etc.)
  if (React.isValidElement(icon)) {
    return (
      <div className="flex shrink-0 items-center justify-center">{icon}</div>
    );
  }

  // Component type (function or object that's not a valid element)
  const isComponentType =
    typeof icon === "function" ||
    (typeof icon === "object" && !React.isValidElement(icon));

  if (isComponentType) {
    return React.createElement(icon as IconComponentType, {
      className:
        "size-4 shrink-0 text-muted-foreground group-focus:text-foreground",
      "aria-hidden": "true",
    });
  }

  return null;
};

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
    className="group relative flex w-full cursor-default select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm font-normal outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    {...props}
  >
    <span className="absolute left-2 flex size-5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <div className="flex flex-1 flex-col overflow-hidden">
      <SelectPrimitive.ItemText>
        <SelectItemContent label={label} badge={badge} icon={Icon} />
      </SelectPrimitive.ItemText>
      {caption && (
        <div className="text-xs text-muted-foreground">
          {typeof caption === "string" ? (
            <span className="truncate">{caption}</span>
          ) : (
            caption
          )}
        </div>
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
    className="-mx-1 my-1 h-px bg-muted"
    {...props}
  />
);
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
