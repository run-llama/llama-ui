"use client";

import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "../lib/utils";

type ResizablePanelGroupProps = {
  /** Layout direction. Both `direction` and `orientation` are accepted. */
  direction?: "horizontal" | "vertical";
  orientation?: "horizontal" | "vertical";
  autoSaveId?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const ResizablePanelGroup = ({
  direction,
  orientation,
  className,
  ...props
}: ResizablePanelGroupProps) => (
  <ResizablePrimitive.Group
    orientation={orientation ?? direction ?? "horizontal"}
    className={cn(
      "flex h-full w-full aria-[orientation=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

type ResizablePanelProps = {
  id?: string;
  order?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  collapsedSize?: number;
  onCollapse?: () => void;
  onExpand?: () => void;
  onResize?: (size: number) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const ResizablePanel = ({ onResize, ...props }: ResizablePanelProps) => (
  <ResizablePrimitive.Panel
    onResize={
      onResize ? (panelSize) => onResize(panelSize.asPercentage) : undefined
    }
    {...props}
  />
);

type ResizableHandleProps = {
  withHandle?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) => (
  <ResizablePrimitive.Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=vertical]:h-px aria-[orientation=vertical]:w-full aria-[orientation=vertical]:after:left-0 aria-[orientation=vertical]:after:h-1 aria-[orientation=vertical]:after:w-full aria-[orientation=vertical]:after:-translate-y-1/2 aria-[orientation=vertical]:after:translate-x-0 [&[aria-orientation=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);

export type {
  ResizableHandleProps,
  ResizablePanelGroupProps,
  ResizablePanelProps,
};
export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
