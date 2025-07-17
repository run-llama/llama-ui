
import { useState, useRef } from "react";
import type { BoundingBox } from "./types";
import { BoundingBoxOverlay } from "./bounding-box-overlay";

export interface ImagePreviewProps {
  src: string;
  boundingBoxes?: BoundingBox[];
  onBoundingBoxClick?: (box: BoundingBox) => void;
  onImageLoad?: (dimensions: { width: number; height: number }) => void;
}

export function ImagePreview({
  src,
  boundingBoxes = [],
  onBoundingBoxClick,
  onImageLoad,
}: ImagePreviewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
      onImageLoad?.({ width: naturalWidth, height: naturalHeight });
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        border: "1px solid #eee",
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt="Preview"
        onLoad={handleImageLoad}
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />

      {/* Bounding box overlay */}
      <BoundingBoxOverlay
        boundingBoxes={boundingBoxes}
        zoom={1}
        containerWidth={imageDimensions.width}
        containerHeight={imageDimensions.height}
        onBoundingBoxClick={onBoundingBoxClick}
      />
    </div>
  );
}
