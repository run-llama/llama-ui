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
  className?: string;
}

export function UploadZone({
  title = "Drag files here to upload",
  description,
  supportedFiles,
  state = "default",
  className,
}: UploadZoneProps) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] w-full flex-col items-center justify-center gap-6 rounded-lg border border-dashed p-8 text-center transition-all",
        state === "focus"
          ? "border-neutral-400 bg-neutral-100 ring-[3px] ring-neutral-950/10"
          : "border-neutral-300 bg-white",
        className
      )}
    >
      <div className="flex max-w-[384px] flex-col items-center gap-4">
        <Upload className="h-5 w-5 text-neutral-500" />
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-base font-medium text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {supportedFiles && (
        <p className="max-w-[384px] text-center text-xs text-muted-foreground">
          {supportedFiles}
        </p>
      )}
    </div>
  );
}
