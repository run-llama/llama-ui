"use client";

import { HelpCircle } from "lucide-react";
import * as React from "react";
import { Tooltip } from "./tooltip";

interface ToolTipperProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  delayDuration?: number;
  side?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  showHelpIcon?: boolean;
}

export function ToolTipper({
  content,
  children,
  delayDuration,
  side,
  disabled,
  showHelpIcon,
}: ToolTipperProps) {
  const triggerContent = showHelpIcon ? (
    <HelpCircle className="relative inline-block size-[14px] stroke-[1.33px] text-muted-foreground hover:text-muted-foreground" />
  ) : (
    children
  );

  if (disabled || !triggerContent) {
    return <>{triggerContent}</>;
  }

  // Ensure triggerContent is a ReactElement
  if (
    !React.isValidElement(triggerContent) ||
    typeof triggerContent !== "object" ||
    triggerContent === null
  ) {
    return <>{triggerContent}</>;
  }

  return (
    <Tooltip
      trigger={triggerContent}
      content={content}
      delayDuration={delayDuration}
      side={side}
    />
  );
}

export default ToolTipper;
