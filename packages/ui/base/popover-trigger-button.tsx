"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export interface PopoverTriggerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isOpen?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const PopoverTriggerButton = ({
  ref,
  className,
  label,
  isOpen,
  fullWidth,
  disabled,
  startIcon,
  endIcon,
  ...props
}: PopoverTriggerButtonProps & {
  ref?: React.RefObject<HTMLButtonElement | null>;
}) => {
  return (
    <button
      type="button"
      ref={ref}
      className={cn(
        "flex h-10 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none transition-all",
        "hover:border-ring hover:bg-accent",
        "focus:ring-ring/50 focus:border-ring focus:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth && "w-full",
        className
      )}
      disabled={disabled}
      aria-expanded={isOpen}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        {startIcon}
        <span className="truncate text-left">{label}</span>
      </div>
      {endIcon !== undefined ? (
        endIcon
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      )}
    </button>
  );
};

PopoverTriggerButton.displayName = "PopoverTriggerButton";

export { PopoverTriggerButton };
