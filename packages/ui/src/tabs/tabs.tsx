"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "inline-flex w-fit items-center justify-center rounded-lg bg-muted text-muted-foreground",
  {
    variants: {
      size: {
        default: "h-9 p-[3px]",
        xs: "h-7 p-[2px]",
        sm: "h-8 p-[2px]",
        lg: "h-10 p-1",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function TabsList({
  className,
  size,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants({ size }), className)}
      {...props}
    />
  );
}

const tabsTriggerVariants = cva(
  "focus-visible:ring-ring/50 dark:data-[state=active]:bg-input/30 inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-medium text-muted-foreground transition-[color,box-shadow] hover:cursor-pointer focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:text-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-[calc(100%-1px)] px-2 py-1 text-sm",
        sm: "h-[calc(100%-1px)] px-1.5 py-0.5 text-xs",
        lg: "h-[calc(100%-1px)] px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function TabsTrigger({
  className,
  size,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ size }), className)}
      {...props}
    />
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
