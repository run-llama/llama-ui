import { File, Maximize, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/base/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/base/tooltip";
import { cn } from "@/lib/utils";

interface FileToolbarProps {
  fileName?: string | null;
  onFullscreen?: () => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRemove?: () => void;
  className?: string;
  isOverlay?: boolean;
}

/**
 * TODO: merge functionality with PdfNavigator and create a generic FileToolbar component
 */
export const FileToolbar = ({
  fileName,
  onFullscreen,
  zoom,
  onZoomIn,
  onZoomOut,
  onRemove,
  className,
  isOverlay = false,
}: FileToolbarProps) => {
  const showZoomControls =
    typeof zoom === "number" &&
    typeof onZoomIn === "function" &&
    typeof onZoomOut === "function";

  return (
    <div
      className={cn(
        "flex h-10 items-center justify-between gap-3 px-6 transition",
        isOverlay
          ? "absolute left-0 right-0 top-0 z-10 border-b bg-white/70"
          : "border-b bg-white",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {fileName && (
          <>
            <File className="size-4" />
            <span className="text-xs text-muted-foreground">{fileName}</span>
          </>
        )}
        {onRemove && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="size-6 p-0"
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove file</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showZoomControls && (
          <>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomOut}
                    className="size-6 p-0"
                  >
                    <Minus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out</TooltipContent>
              </Tooltip>
              <span className="text-center text-xs text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomIn}
                    className="size-6 p-0"
                  >
                    <Plus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in</TooltipContent>
              </Tooltip>
            </div>

            {onFullscreen && <div className="h-6 w-px bg-border" />}
          </>
        )}

        {onFullscreen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onFullscreen}
                className="size-6 p-0"
              >
                <Maximize className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
