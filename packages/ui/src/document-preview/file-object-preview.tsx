import { useRef, useState } from "react";
import { FileToolbar } from "./file-tool-bar";

export const FileObjectPreview = ({
  fileName,
  contentUrl,
  onRemove,
}: {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
}) => {
  const containerRef = useRef<HTMLObjectElement>(null);
  const [zoom, setZoom] = useState(1);

  const toggleFullscreen = () => {
    window.open(contentUrl, "_blank");
  };

  const onFullscreen = () => {
    toggleFullscreen();
  };

  const handleZoomIn = () => {
    setZoom((z) => z + 0.1);
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.1, z - 0.1));
  };

  const isImage = fileName?.match(/\.(jpg|jpeg|png|gif|bmp|tiff|ico|webp)$/i);

  return (
    <div className="relative flex h-full flex-col">
      <FileToolbar
        fileName={fileName}
        onFullscreen={onFullscreen}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRemove={onRemove}
        isOverlay
      />
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        {isImage ? (
          <img
            src={contentUrl}
            alt={fileName ?? "uploaded_file"}
            className="h-full w-full rounded-none object-contain p-4"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          />
        ) : (
          <object
            ref={containerRef}
            data={contentUrl}
            className="h-full w-full bg-white"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            <p className="p-4 text-center text-xs text-muted-foreground">
              Your browser doesn&apos;t support file object preview.{" "}
              <a
                href={contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Download File
              </a>
            </p>
          </object>
        )}
      </div>
    </div>
  );
};
