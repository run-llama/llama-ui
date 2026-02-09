"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn, normalizeCid } from "../lib/utils";

/**
 * Tabs - A tab navigation component for organizing content into separate views.
 *
 * Composition:
 * - `Tabs` - Root component
 * - `TabsList` - Container for tab triggers with variant support
 * - `TabsTrigger` - Individual tab button with explicit label, icon, and badge support
 * - `TabsContent` - Content panel for each tab
 *
 * Variants:
 * - `default` - Rounded background with padding
 * - `underline` - Minimal underline style (recommended for icon tabs)
 *
 * Features:
 * - Icon support via `icon` prop
 * - Optional badge display
 * - Icon-only tabs (omit label)
 *
 * Example:
 * ```tsx
 * <Tabs defaultValue="overview">
 *   <TabsList variant="default">
 *     <TabsTrigger value="overview" label="Overview" />
 *     <TabsTrigger value="settings" label="Settings" />
 *   </TabsList>
 *   <TabsContent value="overview">Overview content</TabsContent>
 *   <TabsContent value="settings">Settings content</TabsContent>
 * </Tabs>
 *
 * // With icons
 * <TabsList variant="underline">
 *   <TabsTrigger value="list" label="List" icon={List} />
 *   <TabsTrigger value="grid" label="Grid" icon={Grid} badge="New" />
 * </TabsList>
 * ```
 */

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva("inline-flex w-fit items-center", {
  variants: {
    variant: {
      default: "bg-muted rounded-lg p-[3px] justify-center",
      underline: "border-b border-border justify-start",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>;

const TabsListContext = React.createContext<{
  variant?: "default" | "underline" | null;
}>({
  variant: "default",
});

function TabsList({ className, variant, ...props }: TabsListProps) {
  const contextValue = React.useMemo(() => ({ variant }), [variant]);

  return (
    <TabsListContext value={contextValue}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    </TabsListContext>
  );
}

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground data-[state=active]:[&_svg]:text-foreground outline-none",
  {
    variants: {
      variant: {
        default:
          "text-foreground rounded-lg px-2 py-1 text-sm min-h-7 min-w-7 border border-transparent data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:bg-input/30 dark:data-[state=active]:border-input focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        underline:
          "text-muted-foreground px-3 py-3 text-sm min-h-12 border-b-2 border-transparent data-[state=active]:text-foreground data-[state=active]:border-primary focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TabsTriggerProps
  extends Omit<
    React.ComponentProps<typeof TabsPrimitive.Trigger>,
    "children" | "className"
  > {
  /** The text label displayed in the tab */
  label?: string;
  /** Optional icon component to display at the start of the trigger */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional badge to display after the label */
  badge?: React.ReactNode;
}

/**
 * TabsTrigger - An opinionated tab trigger component matching the LlamaCloud design system.
 *
 * Key differences from base Shadcn TabsTrigger:
 * - Uses explicit `label`, `icon`, and `badge` props instead of arbitrary children
 * - Fixed internal structure (icon → label → badge)
 * - Styling matches design system states (default, focus, disabled, active)
 */
function TabsTrigger({ label, icon: Icon, badge, ...props }: TabsTriggerProps) {
  const { variant } = React.use(TabsListContext);

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        tabsTriggerVariants({ variant: variant as "default" | "underline" }),
      )}
      da-cid={label ? normalizeCid(label) : undefined}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" />}
      {label && <span>{label}</span>}
      {badge && <div className="flex shrink-0">{badge}</div>}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export {
  Tabs,
  TabsContent,
  TabsList,
  tabsListVariants,
  TabsTrigger,
  tabsTriggerVariants,
};
