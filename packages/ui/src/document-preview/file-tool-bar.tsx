import {
  ChevronLeft,
  ChevronRight,
  Download,
  File,
  Maximize,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/base/button";
import { Input } from "@/base/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/base/tooltip";
import { cn } from "@/lib/utils";

export interface FileToolbarProps {
  fileName?: string | null;
  onFullscreen?: () => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  onReset?: () => void;
  onRemove?: () => void;
  onDownload?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  isOverlay?: boolean;
}

export const FileToolbar = ({
  fileName,
  onFullscreen,
  scale,
  onScaleChange,
  onReset,
  onRemove,
  onDownload,
  currentPage,
  totalPages,
  onPageChange,
  className,
  isOverlay = false,
}: FileToolbarProps) => {
  const [pageInput, setPageInput] = useState<string>(
    currentPage?.toString() ?? "1"
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const showZoomControls =
    typeof scale === "number" && typeof onScaleChange === "function";

  const showPageNavigation =
    typeof currentPage === "number" &&
    typeof totalPages === "number" &&
    typeof onPageChange === "function";

  // Only update pageInput when currentPage changes and user is not editing
  useEffect(() => {
    if (!isEditing && typeof currentPage === "number") {
      setPageInput(currentPage.toString());
    }
  }, [currentPage, isEditing]);

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
    setIsEditing(true);
  };

  const handlePageInputSubmit = () => {
    if (!showPageNavigation || !totalPages || !currentPage || !onPageChange) {
      return;
    }
    const pageNumber = parseInt(pageInput);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    } else {
      setPageInput(currentPage.toString());
    }
    setIsEditing(false);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePageInputSubmit();
    }
  };

  const handlePageInputFocus = () => {
    setIsEditing(true);
  };

  const handlePrevPage = () => {
    if (
      showPageNavigation &&
      currentPage !== undefined &&
      totalPages !== undefined &&
      onPageChange &&
      currentPage > 1
    ) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (
      showPageNavigation &&
      currentPage !== undefined &&
      totalPages !== undefined &&
      onPageChange &&
      currentPage < totalPages
    ) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    if (showZoomControls && scale !== undefined && onScaleChange) {
      onScaleChange(Math.min(scale + 0.25, 3.0));
    }
  };

  const handleZoomOut = () => {
    if (showZoomControls && scale !== undefined && onScaleChange) {
      onScaleChange(Math.max(scale - 0.25, 0.5));
    }
  };

  const handleReset = () => {
    if (showZoomControls && onScaleChange) {
      onScaleChange(1.0);
    }
    if (onReset) {
      onReset();
    }
  };

  const hasControls =
    showPageNavigation ||
    showZoomControls ||
    onDownload ||
    onFullscreen ||
    onReset;

  return (
    <div
      className={cn(
        "flex h-10 items-center justify-between gap-3 px-6 transition",
        isOverlay
          ? [
              "absolute left-0 right-0 top-0 z-10 border-b bg-white/70",
              isHovered ? "opacity-100" : "opacity-20",
              "transition-opacity duration-300 ease-in-out",
            ]
          : "border-b bg-white",
        className
      )}
      onMouseEnter={() => isOverlay && setIsHovered(true)}
      onMouseLeave={() => isOverlay && setIsHovered(false)}
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

      {hasControls && (
        <div className="flex items-center gap-3">
          {/* Page Navigation */}
          {showPageNavigation && (
            <>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === undefined || currentPage <= 1}
                      className="size-6 p-0"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous page</TooltipContent>
                </Tooltip>

                <div className="flex items-center justify-center gap-0.5">
                  <Input
                    type="number"
                    value={pageInput}
                    onChange={(e) => handlePageInputChange(e.target.value)}
                    onFocus={handlePageInputFocus}
                    onBlur={handlePageInputSubmit}
                    onKeyDown={handlePageInputKeyDown}
                    className="size-6 px-1 text-center text-xs! rounded-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 [-moz-appearance:textfield] shadow-none border border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none"
                    min={1}
                    max={totalPages}
                  />
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="flex items-center text-xs text-muted-foreground h-7 ml-1">
                    {totalPages}
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={
                        currentPage === undefined ||
                        totalPages === undefined ||
                        currentPage >= totalPages
                      }
                      className="size-6 p-0"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next page</TooltipContent>
                </Tooltip>
              </div>

              {(showZoomControls || onDownload || onFullscreen || onReset) && (
                <div className="h-6 w-px bg-border" />
              )}
            </>
          )}

          {/* Zoom Controls */}
          {showZoomControls && (
            <>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={scale !== undefined && scale <= 0.5}
                      className="size-6 p-0"
                      aria-label="Zoom Out"
                    >
                      <Minus className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom out</TooltipContent>
                </Tooltip>
                <span className="text-center text-xs text-muted-foreground">
                  {scale !== undefined ? Math.round(scale * 100) : 0}%
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={scale !== undefined && scale >= 3.0}
                      className="size-6 p-0"
                      aria-label="Zoom In"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom in</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="size-6 p-0"
                      aria-label="Reset Zoom"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset zoom</TooltipContent>
                </Tooltip>
              </div>

              {(onDownload || onFullscreen) && (
                <div className="h-6 w-px bg-border" />
              )}
            </>
          )}

          {/* Download Button */}
          {onDownload && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDownload}
                    className="size-6 p-0"
                    aria-label="Download PDF"
                  >
                    <Download className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              {onFullscreen && <div className="h-6 w-px bg-border" />}
            </>
          )}

          {/* Fullscreen Button */}
          {onFullscreen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFullscreen}
                  className="size-6 p-0"
                  aria-label="Fullscreen"
                >
                  <Maximize className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};
