"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/base/dialog";
import { cn } from "@/lib/utils";

export interface FullscreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  headerActions?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function FullscreenDialog({
  open,
  onOpenChange,
  title,
  children,
  maxWidth = "max-w-[95vw]",
  headerActions,
  className,
  contentClassName,
}: FullscreenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[95vh] flex-col overflow-hidden",
          maxWidth,
          className
        )}
      >
        <DialogHeader>
          <div className="flex items-center justify-between p-2">
            <DialogTitle>{title}</DialogTitle>
            {headerActions}
          </div>
        </DialogHeader>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            contentClassName
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
