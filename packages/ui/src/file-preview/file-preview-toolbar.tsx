import { Button } from "@/base/button";
import { Download, File, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePreviewToolbarProps {
  fileName: string;
  onDownload?: () => void;
  onFullscreen?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const FilePreviewToolbar = ({
  fileName,
  onDownload,
  onFullscreen,
  children,
  className,
}: FilePreviewToolbarProps) => {
  const defaultActions = (
    <>
      {onDownload && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="size-6 p-0"
          title="Download"
        >
          <Download className="size-3" />
        </Button>
      )}
      {onFullscreen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onFullscreen}
          className="size-6 p-0"
          title="Fullscreen"
        >
          <Maximize className="size-3" />
        </Button>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "bg-white border px-4 flex items-center justify-between gap-3 h-8",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <File className="size-3" />
        <span className="text-xs text-muted-foreground">{fileName}</span>
      </div>
      <div className="flex items-center gap-3">
        {children ?? defaultActions}
      </div>
    </div>
  );
};
