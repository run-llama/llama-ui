import * as React from "react";

import { cn } from "../lib/utils";

interface SeparatorProps extends React.ComponentProps<"div"> {
  /** Direction of the separator line ("horizontal" | "vertical", default: "horizontal") */
  orientation?: "horizontal" | "vertical";
}

/**
 * Separator - A simple visual divider component.
 *
 * Features:
 * - Two orientations: horizontal and vertical
 * - Semantic HTML with role="separator"
 * - Styled with border color
 *
 * Example:
 * Horizontal divider: <Separator />
 * Vertical divider: <Separator orientation="vertical" className="h-10" />
 */

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
