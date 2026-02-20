"use client";

import { Button } from "./button";
import { Tooltip } from "./tooltip";
import { useClipboard } from "foxact/use-clipboard";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  value: string;
  label?: string;
  tooltip?: string;
  size?: "icon" | "icon-sm";
  variant?: "outline" | "ghost";
}

export function CopyButton({
  value,
  label = "Copy",
  tooltip,
  size = "icon",
  variant = "outline",
}: CopyButtonProps) {
  const { copy, copied } = useClipboard();

  const handleCopy = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    toast.promise(copy(value), {
      loading: "Copying...",
      success: "Copied to clipboard!",
      error: "Failed to copy",
    });
  };

  const defaultTooltipContent = copied ? "Copied!" : label;

  return (
    <Tooltip
      trigger={
        <Button
          variant={variant}
          size={size}
          onClick={handleCopy}
          label={label}
          startIcon={copied ? <Check /> : <Copy />}
        />
      }
      content={tooltip ?? defaultTooltipContent}
    />
  );
}
