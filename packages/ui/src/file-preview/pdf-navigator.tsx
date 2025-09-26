import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Download,
  RotateCcw,
  Plus,
  Maximize,
} from "lucide-react";
import { Button } from "@/base/button";
import { Input } from "@/base/input";
import { FilePreviewToolbar } from "./file-preview-toolbar";
import { cn } from "@/lib/utils";

interface PdfNavigatorProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onDownload?: () => void;
  onReset?: () => void;
  onFullscreen: () => void;
  className?: string;
}

export const PdfNavigator = ({
  fileName,
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onScaleChange,
  onDownload,
  onReset,
  onFullscreen,
  className,
}: PdfNavigatorProps) => {
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Only update pageInput when currentPage changes and user is not editing
  useEffect(() => {
    if (!isEditing) {
      setPageInput(currentPage.toString());
    }
  }, [currentPage, isEditing]);

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
    setIsEditing(true);
  };

  const handlePageInputSubmit = () => {
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
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    onScaleChange(Math.min(scale + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    onScaleChange(Math.max(scale - 0.25, 0.5));
  };

  const handleReset = () => {
    onScaleChange(1.0);
    onReset?.();
  };

  const handleFullscreen = () => {
    onFullscreen();
  };

  return (
    <div className={cn("sticky top-0 w-full z-50 h-8 text-xs", className)}>
      <FilePreviewToolbar
        fileName={fileName}
        onDownload={onDownload}
        onFullscreen={onFullscreen}
        className={className}
      >
        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="size-6 p-0"
          >
            <ChevronLeft className="size-3" />
          </Button>

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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="size-6 p-0"
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="size-6 p-0"
            title="Zoom Out"
          >
            <Minus className="size-3" />
          </Button>

          <span className="text-xs text-muted-foreground text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="size-6 p-0"
            title="Zoom In"
          >
            <Plus className="size-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="size-6 p-0"
            title="Reset Zoom"
          >
            <RotateCcw className="size-3" />
          </Button>
        </div>

        {/* Divider */}
        {onDownload && <div className="w-px h-6 bg-border" />}

        {/* Download Button */}
        {onDownload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="size-6 p-0"
            title="Download PDF"
          >
            <Download className="size-3" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleFullscreen}
          className="size-6 p-0"
          title="Fullscreen"
        >
          <Maximize className="size-3" />
        </Button>
      </FilePreviewToolbar>
    </div>
  );
};
