import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UploadZone - An empty state component for file upload areas.
 *
 * Props:
 * - `state` - Visual state of the component: "default" or "focus"
 * - `title` - Main heading text (default: "Drag files here to upload")
 * - `description` - Secondary description text below the title
 * - `supportedFiles` - Text describing supported file formats (displayed if provided)
 *
 * States:
 * - `default` - Standard appearance with neutral colors
 * - `focus` - Highlighted appearance for drag-over or focus states
 *
 * Example:
 * ```tsx
 * <UploadZone
 *   state="default"
 *   title="Drag files here to upload"
 *   description="Up to 20 files, 315 MB total"
 *   supportedFiles="Supported: PDF, DOCX, PNG"
 * />
 * ```
 */

export interface UploadZoneProps {
  state?: "default" | "focus";
  title?: string;
  description?: string;
  supportedFiles?: string;
}

export function UploadZone({
  title = "Drag files here to upload",
  description,
  supportedFiles,
  state = "default",
}: UploadZoneProps) {
  // Custom dashed border with wider spacing (8px dash, 8px gap)
  const borderColor = state === "focus" ? "%23737373" : "%23a3a3a3";
  const dashedBorderStyle = {
    backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='${borderColor}' stroke-width='1' stroke-dasharray='8%2c 8' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-[200px] w-full flex-1 flex-col items-center rounded-2xl px-4 py-6 text-center transition-all",
        state === "focus"
          ? "bg-neutral-100 ring-[3px] ring-neutral-950/10"
          : "bg-white"
      )}
      style={dashedBorderStyle}
    >
      {/* Centered main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Upload className="h-5 w-5 text-neutral-500" />
        <div className="flex max-w-[384px] flex-col items-center gap-1 text-center">
          <p className="text-base font-medium text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {/* Supported files at bottom */}
      {supportedFiles && (
        <p className="max-w-[384px] pb-4 text-center text-xs text-muted-foreground">
          {supportedFiles}
        </p>
      )}
    </div>
  );
}
