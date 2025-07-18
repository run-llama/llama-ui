import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/base/button";
import { Input } from "@/base/input";

interface PdfNavigatorProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onDownload?: () => void;
  onReset?: () => void;
}

export const PdfNavigator = ({
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onScaleChange,
  onDownload,
  onReset,
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

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/95 backdrop-blur-sm border rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center justify-center gap-1">
            <Input
              type="number"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onFocus={handlePageInputFocus}
              onBlur={handlePageInputSubmit}
              onKeyDown={handlePageInputKeyDown}
              className="h-7 w-7 px-1 text-center text-sm rounded-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 [-moz-appearance:textfield]"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-muted-foreground">/</span>
            <span className="flex items-center text-sm text-muted-foreground h-7">
              {totalPages}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
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
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 p-0"
            title="Reset Zoom"
          >
            <RotateCcw className="h-4 w-4" />
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
            className="h-8 w-8 p-0"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
