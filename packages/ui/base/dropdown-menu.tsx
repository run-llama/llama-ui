import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn, normalizeCid } from "../lib/utils";
import { Badge } from "./badge";

/**
 * DropdownMenu - A menu component that appears when triggered.
 *
 * Composition:
 * - `DropdownMenu` - Root component
 * - `DropdownMenuTrigger` - Opens the menu when clicked
 * - `DropdownMenuContent` - Container for menu items
 * - `DropdownMenuGroup` - Groups related menu items
 * - `DropdownMenuSub` - Submenu trigger
 * - `DropdownMenuSubContent` - Submenu content container
 * - `DropdownMenuSubTrigger` - Trigger for submenus with optional icon, caption, and badge
 * - `DropdownMenuItem` - Menu item with optional icon, caption, badge, and shortcut
 * - `DropdownMenuLabel` - Section label
 * - `DropdownMenuSeparator` - Visual divider
 * - `DropdownMenuUserItem` - Special user profile item with avatar
 *
 * Example:
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild>
 *     <Button label="Menu" />
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuUserItem
 *       fullName="John Doe"
 *       email="john@example.com"
 *     />
 *     <DropdownMenuSeparator />
 *     <DropdownMenuGroup>
 *       <DropdownMenuItem icon={<Settings />}>Settings</DropdownMenuItem>
 *     </DropdownMenuGroup>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 */

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

interface DropdownMenuSubTriggerProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>,
    "children" | "className"
  > {
  /** Add left padding for visual indentation */
  inset?: boolean;
  /** Icon to display at the start of the trigger */
  icon?: React.ReactNode;
  /** The text label for the trigger */
  label: string;
  /** Secondary text displayed below the main label */
  caption?: string;
  /** Badge to display before the chevron */
  badge?: string;
  ref?: React.Ref<React.ComponentRef<
    typeof DropdownMenuPrimitive.SubTrigger
  > | null>;
}

const DropdownMenuSubTrigger = ({
  ref,
  inset,
  icon,
  label,
  caption,
  badge,
  ...props
}: DropdownMenuSubTriggerProps) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "group flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8"
    )}
    {...props}
  >
    {icon && (
      <span className="flex min-h-5 items-center text-muted-foreground group-focus:text-foreground group-data-[state=open]:text-foreground">
        {icon}
      </span>
    )}
    <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0">
      <span className="w-full truncate">{label}</span>
      {caption && (
        <span className="w-full text-sm text-muted-foreground">{caption}</span>
      )}
    </div>
    {badge && <Badge variant="secondary" label={badge} />}
    <ChevronRight className="ml-auto size-4" />
  </DropdownMenuPrimitive.SubTrigger>
);
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
  ref?: React.Ref<React.ComponentRef<
    typeof DropdownMenuPrimitive.SubContent
  > | null>;
}) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      className
    )}
    {...props}
  />
);
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = ({
  ref,
  className,
  align = "start",
  alignOffset = -1,
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
  ref?: React.Ref<React.ComponentRef<
    typeof DropdownMenuPrimitive.Content
  > | null>;
}) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

interface DropdownMenuItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>,
    "children" | "className"
  > {
  /** Add left padding for visual indentation */
  inset?: boolean;
  /** Style the item as a destructive action (red text) */
  destructive?: boolean;
  /** Icon to display at the start of the item */
  icon?: React.ReactNode;
  /** The text label for the item */
  label: string;
  /** Secondary text displayed below the main label */
  caption?: string;
  /** Badge to display before the shortcut */
  badge?: string;
  /** Keyboard shortcut text displayed on the right (e.g., "⌘K") */
  shortcut?: string;
  ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Item> | null>;
}

const DropdownMenuItem = ({
  ref,
  inset,
  destructive,
  icon,
  label,
  caption,
  badge,
  shortcut,
  ...props
}: DropdownMenuItemProps) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "group relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      destructive &&
        "focus:bg-destructive/10 text-destructive focus:text-destructive"
    )}
    da-cid={normalizeCid(label)}
    {...props}
  >
    {icon && (
      <span
        className={cn(
          "flex min-h-5 items-center text-muted-foreground group-focus:text-foreground",
          destructive && "text-destructive group-focus:text-destructive"
        )}
      >
        {icon}
      </span>
    )}
    <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0">
      <span className="w-full truncate">{label}</span>
      {caption && (
        <span className="w-full text-sm text-muted-foreground">{caption}</span>
      )}
    </div>
    {badge && <Badge variant="secondary" label={badge} />}
    {shortcut && (
      <span className="ml-auto text-xs tracking-widest opacity-60">
        {shortcut}
      </span>
    )}
  </DropdownMenuPrimitive.Item>
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

interface DropdownMenuCheckboxItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    "children" | "className"
  > {
  /** Icon to display at the start of the item */
  icon?: React.ReactNode;
  /** The text label for the item */
  label: string;
  /** Secondary text displayed below the main label */
  caption?: string;
  /** Badge to display before the shortcut */
  badge?: string;
  /** Keyboard shortcut text displayed on the right (e.g., "⌘K") */
  shortcut?: string;
  ref?: React.Ref<React.ComponentRef<
    typeof DropdownMenuPrimitive.CheckboxItem
  > | null>;
}

const DropdownMenuCheckboxItem = ({
  ref,
  checked,
  icon,
  label,
  caption,
  badge,
  shortcut,
  onSelect,
  ...props
}: DropdownMenuCheckboxItemProps) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "group relative flex cursor-pointer select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    )}
    checked={checked}
    onSelect={(event) => {
      event.preventDefault();
      onSelect?.(event);
    }}
    da-cid={normalizeCid(label)}
    {...props}
  >
    <span className="absolute left-2 top-1/2 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {icon && (
      <span className="flex h-5 items-center text-muted-foreground group-focus:text-foreground [&_svg]:size-4 [&_svg]:shrink-0">
        {icon}
      </span>
    )}
    <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0">
      <span className="w-full truncate leading-5">{label}</span>
      {caption && (
        <span className="w-full text-sm text-muted-foreground">{caption}</span>
      )}
    </div>
    {badge && <Badge variant="secondary" label={badge} />}
    {shortcut && (
      <span className="ml-auto flex h-5 items-center text-xs tracking-widest opacity-60">
        {shortcut}
      </span>
    )}
  </DropdownMenuPrimitive.CheckboxItem>
);
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

interface DropdownMenuRadioItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>,
    "children" | "className"
  > {
  /** Icon to display at the start of the item */
  icon?: React.ReactNode;
  /** The text label for the item */
  label: string;
  /** Secondary text displayed below the main label */
  caption?: string;
  /** Badge to display before the shortcut */
  badge?: string;
  /** Keyboard shortcut text displayed on the right (e.g., "⌘K") */
  shortcut?: string;
  ref?: React.Ref<React.ComponentRef<
    typeof DropdownMenuPrimitive.RadioItem
  > | null>;
}

const DropdownMenuRadioItem = ({
  ref,
  icon,
  label,
  caption,
  badge,
  shortcut,
  ...props
}: DropdownMenuRadioItemProps) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "group relative flex cursor-pointer select-none items-start gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    )}
    da-cid={normalizeCid(label)}
    {...props}
  >
    <span className="absolute left-2 top-1/2 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {icon && (
      <span className="flex h-5 items-center text-muted-foreground group-focus:text-foreground [&_svg]:size-4 [&_svg]:shrink-0">
        {icon}
      </span>
    )}
    <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0">
      <span className="w-full truncate leading-5">{label}</span>
      {caption && (
        <span className="w-full text-sm text-muted-foreground">{caption}</span>
      )}
    </div>
    {badge && <Badge variant="secondary" label={badge} />}
    {shortcut && (
      <span className="ml-auto flex h-5 items-center text-xs tracking-widest opacity-60">
        {shortcut}
      </span>
    )}
  </DropdownMenuPrimitive.RadioItem>
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

interface DropdownMenuLabelProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>,
    "children" | "className"
  > {
  /** Heading level for styling (1 = bold, 2 = indented) */
  level?: 1 | 2;
  /** Optional icon to display before the label */
  icon?: React.ReactNode;
  /** The text label */
  label: string;
  ref?: React.Ref<React.ComponentRef<
    typeof DropdownMenuPrimitive.Label
  > | null>;
}

const DropdownMenuLabel = ({
  ref,
  level = 1,
  icon,
  label,
  ...props
}: DropdownMenuLabelProps) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "flex items-start gap-2 px-2 py-1.5 text-sm font-semibold",
      level === 2 && "pl-8"
    )}
    {...props}
  >
    {icon && (
      <span className="flex min-h-5 items-center text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
        {icon}
      </span>
    )}
    {label}
  </DropdownMenuPrimitive.Label>
);
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & {
  ref?: React.Ref<React.ComponentRef<
    typeof DropdownMenuPrimitive.Separator
  > | null>;
}) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
);
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/**
 * @deprecated Use the `shortcut` prop on DropdownMenuItem instead.
 */
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

interface DropdownMenuUserItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  /** User's email address */
  email: string;
  /** User's full name */
  fullName: string;
  /** Optional custom avatar (defaults to initials in a circle) */
  avatar?: React.ReactNode;
  ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Item>>;
}

const DropdownMenuUserItem = ({
  className,
  email,
  fullName,
  avatar,
  ref,
  ...props
}: DropdownMenuUserItemProps) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-1 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {avatar ? (
      avatar
    ) : (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        <span className="text-xs font-medium uppercase">
          {fullName
            .split(" ")
            .map((n: string) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
      </div>
    )}
    <div className="flex flex-1 flex-col text-left">
      <span className="font-medium text-popover-foreground">{fullName}</span>
      <span className="text-xs text-muted-foreground">{email}</span>
    </div>
  </DropdownMenuPrimitive.Item>
);
DropdownMenuUserItem.displayName = "DropdownMenuUserItem";

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuUserItem,
};
