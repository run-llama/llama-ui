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
        "flex w-fit flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-2",
        type === "info" && "border-blue-500",
        type === "warning" && "bg-yellow-400",
        type === "warning" && "border-yellow-500",
        type === "error" && "border-red-500",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "rounded-full p-1",
            type === "info" && "bg-blue-500",
            type === "warning" && "bg-yellow-400",
            type === "error" && "bg-red-500"
          )}
        >
          {type === "info" && <Info className="size-4 text-white" />}
          {type === "warning" && (
            <AlertTriangle className="size-4 text-slate-900" />
          )}
          {type === "error" && <XCircle className="size-4 text-white" />}
        </div>
      </div>
      <div className={cn("text-sm", type === "warning" && "text-slate-900")}>
        {children}
      </div>
    </div>
  );
};
