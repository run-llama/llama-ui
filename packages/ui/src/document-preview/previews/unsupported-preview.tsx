import { FileToolbar } from "../file-tool-bar";

export function UnsupportedPreview({
  fileName,
  contentUrl,
  onRemove,
}: {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
}) {
  const handleFullscreen = () => {
    window.open(contentUrl, "_blank");
  };

  return (
    <div className="relative flex h-full flex-col">
      <FileToolbar
        fileName={fileName}
        onFullscreen={handleFullscreen}
        onRemove={onRemove}
        isOverlay
      />
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        <p className="p-4 text-center text-xs text-muted-foreground">
          This file type is not supported for preview. You can download to view
          it.{" "}
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Download File
          </a>
        </p>
      </div>
    </div>
  );
}
