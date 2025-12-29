import { useState, useRef } from "react";
import { FileToolbar } from "../file-tool-bar";
import { BoundingBoxOverlay } from "../../file-preview/bounding-box-overlay";
import type { Highlight } from "../../file-preview/types";
import type { BoundingBox } from "../../file-preview/types";

export const ImagePreview = ({
  fileName,
  contentUrl,
  onRemove,
  highlights,
}: {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
  highlights?: Highlight[];
}) => {
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const toggleFullscreen = () => {
    window.open(contentUrl, "_blank");
  };

  const onFullscreen = () => {
    toggleFullscreen();
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
    }
  };

  const boundingBoxes: BoundingBox[] = (highlights || [])
    .filter((h) => h.page === 1 || h.page === 0)
    .map((highlight, idx) => ({
      id: `highlight-${idx}`,
      x: highlight.x,
      y: highlight.y,
      width: highlight.width,
      height: highlight.height,
      color: "rgba(255, 215, 0, 0.25)",
    }));

  return (
    <div className="relative flex h-full flex-col">
      <FileToolbar
        fileName={fileName}
        onFullscreen={onFullscreen}
        scale={scale}
        onScaleChange={handleScaleChange}
        onRemove={onRemove}
      />
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        <div className="relative inline-block w-full h-full">
          <img
            ref={imgRef}
            src={contentUrl}
            alt={fileName ?? "uploaded_file"}
            className="h-full w-full rounded-none object-contain p-4"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            onLoad={handleImageLoad}
          />
          {boundingBoxes.length > 0 && imageDimensions.width > 0 && (
            <div
              className="absolute top-0 left-0 p-4"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <BoundingBoxOverlay
                boundingBoxes={boundingBoxes}
                zoom={1}
                containerWidth={imageDimensions.width}
                containerHeight={imageDimensions.height}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
