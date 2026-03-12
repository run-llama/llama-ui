import { cn } from "../lib/utils";
import { Info, AlertTriangle, XCircle } from "lucide-react";
import React from "react";
export const AlertCard = ({
  children,
  type,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  type: "info" | "warning" | "error";
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex w-fit flex-row items-center gap-3 rounded-lg border border-border bg-card p-2",
        type === "info" && "border-primary",
        type === "warning" && "border-warning bg-warning-foreground",
        type === "error" && "border-destructive",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "rounded-full p-1",
            type === "info" && "bg-primary",
            type === "warning" && "bg-warning",
            type === "error" && "bg-destructive"
          )}
        >
          {type === "info" && (
            <Info className="size-4 text-primary-foreground" />
          )}
          {type === "warning" && (
            <AlertTriangle className="size-4 text-warning-foreground" />
          )}
          {type === "error" && (
            <XCircle className="size-4 text-destructive-foreground" />
          )}
        </div>
      </div>
      <div className={cn("text-sm text-foreground")}>
        {children}
      </div>
    </div>
  );
};
