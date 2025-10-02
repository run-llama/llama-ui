import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/base/button";
import { Progress } from "@/base/progress";
import { formatFileSize } from "./file-utils";
import {
  calculateUploadStats,
  getVisibleFiles,
  getDisplayModes,
} from "./upload-progress-utils";

export interface FileUploadProgress {
  file: File;
  progress: number; // 0-100
  status: "uploading" | "completed" | "error" | "canceled";
  error?: string;
}

export interface UploadProgressProps {
  files: FileUploadProgress[];
  onClose: () => void;
}

export function UploadProgress({ files, onClose }: UploadProgressProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (files.length === 0) return null;

  // Calculate statistics using util function
  const stats = calculateUploadStats(files);

  // Determine display modes using util function
  const { showOverallProgress, isCompact } = getDisplayModes(files.length);

  // Determine what to show using util function
  const maxVisible = 5;
  const { filesToShow, shouldShowViewMore } = getVisibleFiles(
    files,
    showAll,
    maxVisible
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border rounded-lg shadow-lg">
      {/* Header */}
      <div className={`p-4 ${showOverallProgress ? "border-b" : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">
            {showOverallProgress
              ? `Uploading Files (${stats.completed}/${stats.total})`
              : files.length === 1
                ? "Uploading File"
                : "Uploading Files"}
          </h3>
          <div className="flex items-center gap-1">
            {showOverallProgress && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ease-in-out ${
                    isCollapsed ? "rotate-180" : "rotate-0"
                  }`}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Overall Progress Bar - only show for many files */}
        {showOverallProgress && (
          <>
            <Progress
              value={stats.totalProgress}
              className={`h-2 mb-2 ${
                stats.uploading === 0 && stats.completed > 0
                  ? "[&>[data-slot=progress-indicator]]:bg-green-500"
                  : ""
              }`}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {stats.completed > 0 && `${stats.completed} completed`}
                {stats.uploading > 0 && `, ${stats.uploading} uploading`}
                {stats.failed > 0 && `, ${stats.failed} failed`}
              </span>
              <span>{stats.totalProgress}%</span>
            </div>
          </>
        )}
      </div>

      {/* File List */}
      {(!showOverallProgress || !isCollapsed) && (
        <div className={`${showOverallProgress ? "p-4" : "px-4 pb-4"}`}>
          {/* Static file list */}
          <div className="space-y-3">
            {filesToShow.map((fileProgress, index) => (
              <FileProgressItem
                key={`${fileProgress.file.name}-${index}`}
                fileProgress={fileProgress}
                isCompact={isCompact}
              />
            ))}
          </div>

          {/* View More/Less Button */}
          {shouldShowViewMore && (
            <div className="pt-2 border-t mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 text-xs transition-all duration-200 hover:bg-accent"
                onClick={() => setShowAll(!showAll)}
              >
                <ChevronDown
                  className={`h-3 w-3 mr-1 transition-transform duration-200 ${
                    showAll ? "rotate-180" : "rotate-0"
                  }`}
                />
                {showAll
                  ? "Show Less"
                  : `View ${files.length - maxVisible} More Files`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FileProgressItemProps {
  fileProgress: FileUploadProgress;
  isCompact?: boolean;
}

function FileProgressItem({
  fileProgress,
  isCompact = false,
}: FileProgressItemProps) {
  const { file, progress, status, error } = fileProgress;

  if (isCompact) {
    // Compact view for many files
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs min-w-0">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status === "error"
                ? "bg-destructive"
                : status === "completed"
                  ? "bg-green-500"
                  : status === "canceled"
                    ? "bg-muted-foreground"
                    : "bg-primary animate-pulse"
            }`}
          />
          <span className="font-medium truncate flex-1 min-w-0" title={file.name}>
            {file.name}
          </span>
          <span className="text-muted-foreground">
            {status === "completed"
              ? "✓"
              : status === "canceled"
                ? "✕"
                : `${Math.round(progress)}%`}
          </span>
        </div>
        {status === "error" && error && (
          <div className="text-xs text-destructive pl-4">{error}</div>
        )}
        {status === "canceled" && (
          <div className="text-xs text-muted-foreground pl-4">Canceled</div>
        )}
      </div>
    );
  }

  // Full view for fewer files
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm min-w-0">
        <span className="font-medium truncate flex-1 min-w-0" title={file.name}>
          {file.name}
        </span>
        <span className="text-muted-foreground ml-2">
          {formatFileSize(file.size)}
        </span>
      </div>

      <div className="space-y-1">
        {/* Progress Bar */}
        <Progress
          value={Math.min(progress, 100)}
          className={`h-2 transition-all duration-300 ${
            status === "error"
              ? "[&>[data-slot=progress-indicator]]:bg-destructive"
              : status === "completed"
                ? "[&>[data-slot=progress-indicator]]:bg-green-500"
                : status === "canceled"
                  ? "[&>[data-slot=progress-indicator]]:bg-muted-foreground"
                  : ""
          }`}
        />

        {/* Status */}
        <div className="flex items-center justify-between text-xs">
          <span
            className={`${
              status === "error"
                ? "text-destructive"
                : status === "completed"
                  ? "text-green-600"
                  : status === "canceled"
                    ? "text-muted-foreground"
                    : "text-muted-foreground"
            }`}
          >
            {status === "error" && error
              ? error
              : status === "completed"
                ? "Completed"
                : status === "canceled"
                  ? "Canceled"
                  : `${Math.round(progress)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
