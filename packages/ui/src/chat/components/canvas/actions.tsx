"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/base/button";
import { useChatCanvas } from "./context";

interface ChatCanvasActionsProps {
  children?: React.ReactNode;
  className?: string;
}

function ChatCanvasActions(props: ChatCanvasActionsProps) {
  const children = props.children ?? (
    <>
      <CanvasCloseButton />
    </>
  );

  return (
    <div className={cn("flex items-center gap-1", props.className)}>
      {children}
    </div>
  );
}

function CanvasCloseButton() {
  const { closeCanvas } = useChatCanvas();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="cursor-pointer rounded-full"
      onClick={closeCanvas}
    >
      <X className="size-4" />
    </Button>
  );
}

ChatCanvasActions.Close = CanvasCloseButton;

export { ChatCanvasActions };
