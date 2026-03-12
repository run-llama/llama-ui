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
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[200px] w-full flex-1 flex-col items-center rounded-2xl p-6 text-center transition-all",
        state === "focus" ? "bg-muted ring-[3px] ring-ring/20" : "bg-background"
      )}
    >
      {/* SVG dashed border - uses absolute positioning to avoid background-image subpixel issues */}
      <svg
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full overflow-visible",
          state === "focus" ? "text-muted-foreground" : "text-ring"
        )}
        fill="none"
      >
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="16"
          ry="16"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="8 8"
          strokeLinecap="square"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Centered main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Upload className="h-5 w-5 text-muted-foreground" />
        <div className="flex max-w-[384px] flex-col items-center gap-1 text-center">
          <p className="text-base font-medium text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {/* Supported files at bottom */}
      {supportedFiles && (
        <p className="max-w-[384px] pt-2 text-center text-xs text-muted-foreground">
          {supportedFiles}
        </p>
      )}
    </div>
  );
}
