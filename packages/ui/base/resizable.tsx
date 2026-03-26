"use client";

import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "../lib/utils";

type ResizablePanelGroupProps = {
  /** Layout direction. Both `direction` and `orientation` are accepted. */
  direction?: "horizontal" | "vertical";
  orientation?: "horizontal" | "vertical";
  /** Persists panel layout to localStorage under this key. */
  autoSaveId?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Inner component that uses the useDefaultLayout hook for autoSaveId support.
 * Must be a separate component because hooks cannot be called conditionally.
 */
const ResizablePanelGroupWithAutoSave = ({
  autoSaveId,
  orientation: resolvedOrientation,
  className,
  children,
  ...props
}: Omit<ResizablePanelGroupProps, "direction" | "orientation"> & {
  orientation: "horizontal" | "vertical";
}) => {
  const { defaultLayout, onLayoutChanged } =
    ResizablePrimitive.useDefaultLayout({
      id: autoSaveId!,
      storage: typeof window !== "undefined" ? localStorage : undefined,
    });

  return (
    <ResizablePrimitive.Group
      orientation={resolvedOrientation}
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      {children}
    </ResizablePrimitive.Group>
  );
};

const ResizablePanelGroup = ({
  direction,
  orientation,
  autoSaveId,
  className,
  children,
  ...props
}: ResizablePanelGroupProps) => {
  const resolvedOrientation = orientation ?? direction ?? "horizontal";

  if (autoSaveId) {
    return (
      <ResizablePanelGroupWithAutoSave
        autoSaveId={autoSaveId}
        orientation={resolvedOrientation}
        className={className}
        {...props}
      >
        {children}
      </ResizablePanelGroupWithAutoSave>
    );
  }

  return (
    <ResizablePrimitive.Group
      orientation={resolvedOrientation}
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      {children}
    </ResizablePrimitive.Group>
  );
};

type ResizablePanelProps = {
  id?: string;
  order?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  collapsedSize?: number;
  disabled?: boolean;
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

/**
 * In v4, a Separator's aria-orientation is perpendicular to the group orientation:
 * - Horizontal group → vertical separators (aria-orientation="vertical")
 * - Vertical group → horizontal separators (aria-orientation="horizontal")
 *
 * Default styles assume horizontal group (vertical separator = thin vertical line).
 * The aria-[orientation=horizontal] selectors handle the vertical group case
 * (horizontal separator = thin horizontal line).
 */
const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) => (
  <ResizablePrimitive.Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:-translate-y-1/2 aria-[orientation=horizontal]:after:translate-x-0 [&[aria-orientation=horizontal]>div]:rotate-90",
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
