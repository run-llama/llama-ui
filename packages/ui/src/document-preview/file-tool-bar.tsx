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
import { Tooltip } from "@/base/tooltip";
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
}: FileToolbarProps) => {
  const [pageInput, setPageInput] = useState<string>(
    currentPage?.toString() ?? "1"
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);

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

  const fileNameElement = fileName && (
    <div className="flex items-center gap-2">
      <File className="size-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{fileName}</span>
    </div>
  );

  const removeButtonElement = onRemove && (
    <Tooltip
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          startIcon={<Trash2 />}
        />
      }
      content="Remove file"
    />
  );

  return (
    <div
      className={cn(
        "flex h-12 items-center justify-between gap-3 px-6 border-b bg-white",
        className
      )}
    >
      {/* Left Side - Page Navigation or File Name + Remove */}
      {showPageNavigation ? (
        <div className="flex items-center gap-1">
          <Tooltip
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handlePrevPage}
                startIcon={<ChevronLeft />}
              />
            }
            content="Previous page"
          />

          <div className="flex items-center justify-center gap-1">
            <Input
              type="number"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onFocus={handlePageInputFocus}
              onBlur={handlePageInputSubmit}
              onKeyDown={handlePageInputKeyDown}
              className="h-6 w-10 px-1 text-center text-xs! rounded-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 [-moz-appearance:textfield] shadow-none border border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none"
              min={1}
              max={totalPages}
            />
            <span className="text-xs text-muted-foreground">of</span>
            <span className="flex items-center text-xs text-muted-foreground h-7 ml-1">
              {totalPages}
            </span>
          </div>

          <Tooltip
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleNextPage}
                disabled={
                  currentPage === undefined ||
                  totalPages === undefined ||
                  currentPage >= totalPages
                }
                startIcon={<ChevronRight />}
              />
            }
            content="Next page"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {fileNameElement}
          {removeButtonElement}
        </div>
      )}

      {/* Controls - Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        {hasControls && (
          <>
            {showPageNavigation &&
              (showZoomControls || onDownload || onFullscreen || onReset) && (
                <div className="h-6 w-px bg-border" />
              )}

            {/* Zoom Controls */}
            {showZoomControls && (
              <>
                <div className="flex items-center gap-1">
                  <Tooltip
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleZoomOut}
                        disabled={scale !== undefined && scale <= 0.5}
                        startIcon={<Minus />}
                        aria-label="Zoom Out"
                      />
                    }
                    content="Zoom out"
                  />
                  <span className="text-center text-xs text-muted-foreground">
                    {scale !== undefined ? Math.round(scale * 100) : 0}%
                  </span>
                  <Tooltip
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleZoomIn}
                        disabled={scale !== undefined && scale >= 3.0}
                        startIcon={<Plus />}
                        aria-label="Zoom In"
                      />
                    }
                    content="Zoom in"
                  />
                  <Tooltip
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleReset}
                        startIcon={<RotateCcw />}
                        aria-label="Reset Zoom"
                      />
                    }
                    content="Reset zoom"
                  />
                </div>

                {(onDownload || onFullscreen) && (
                  <div className="h-6 w-px bg-border" />
                )}
              </>
            )}

            {/* Download Button */}
            {onDownload && (
              <>
                <Tooltip
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onDownload}
                      startIcon={<Download />}
                      aria-label="Download PDF"
                    />
                  }
                  content="Download"
                />
                {onFullscreen && <div className="h-6 w-px bg-border" />}
              </>
            )}

            {/* Fullscreen Button */}
            {onFullscreen && (
              <Tooltip
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onFullscreen}
                    startIcon={<Maximize />}
                    aria-label="Fullscreen"
                  />
                }
                content="Fullscreen"
              />
            )}
          </>
        )}

        {/* File name and remove button on right side when page navigation is shown */}
        {showPageNavigation && (
          <>
            {fileNameElement}
            {removeButtonElement}
          </>
        )}
      </div>
    </div>
  );
};
