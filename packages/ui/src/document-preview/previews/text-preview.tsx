import { useEffect, useState } from "react";
import { FileToolbar } from "../file-tool-bar";

interface TextPreviewProps {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
  className?: string;
}

export function TextPreview({
  fileName,
  contentUrl,
  onRemove,
  className,
}: TextPreviewProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFileContent = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch(contentUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch document content.");
        }
        const text = await response.text();
        setFileContent(text);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[TextPreview] Error loading text content:", error);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load text content"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();
  }, [contentUrl]);

  const toggleFullscreen = () => {
    window.open(contentUrl, "_blank");
  };

  const onFullscreen = () => {
    toggleFullscreen();
  };

  if (isLoading) {
    return (
      <div className="relative flex h-full flex-col">
        <FileToolbar
          fileName={fileName}
          onFullscreen={onFullscreen}
          onRemove={onRemove}
          isOverlay
        />
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">
            Loading text content...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative flex h-full flex-col">
        <FileToolbar
          fileName={fileName}
          onFullscreen={onFullscreen}
          onRemove={onRemove}
          isOverlay
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
          <p className="text-sm text-destructive">
            Failed to load text content
          </p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
          <button
            type="button"
            onClick={() => window.open(contentUrl, "_blank")}
            className="text-sm text-primary hover:underline"
          >
            Download File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex h-full flex-col ${className ?? ""}`}>
      <FileToolbar
        fileName={fileName}
        onFullscreen={onFullscreen}
        onRemove={onRemove}
        isOverlay
      />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="relative h-full w-full">
          <pre className="absolute inset-0 whitespace-pre-wrap bg-gray-50/80 p-6 font-mono text-sm leading-relaxed text-gray-800">
            {fileContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
