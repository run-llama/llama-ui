"use client";

import { HelpCircle } from "lucide-react";
import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

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

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
      <TooltipContent side={side} hidden={disabled}>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default ToolTipper;
