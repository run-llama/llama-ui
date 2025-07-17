
import type { BoundingBox } from "./types";

export interface BoundingBoxOverlayProps {
  boundingBoxes: BoundingBox[];
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  onBoundingBoxClick?: (box: BoundingBox) => void;
}

export function BoundingBoxOverlay({
  boundingBoxes,
  zoom,
  containerWidth,
  containerHeight,
  onBoundingBoxClick,
}: BoundingBoxOverlayProps) {
  if (containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: containerWidth * zoom,
        height: containerHeight * zoom,
        pointerEvents: "none",
      }}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    >
      {boundingBoxes.map((box) => (
        <g key={box.id}>
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill={box.color || "rgba(255, 0, 0, 0.2)"}
            stroke={box.color || "red"}
            strokeWidth={2 / zoom}
            style={{
              pointerEvents: "auto",
              cursor: onBoundingBoxClick ? "pointer" : "default",
            }}
            onClick={() => onBoundingBoxClick?.(box)}
          />
          {box.label && (
            <text
              x={box.x}
              y={box.y - 5}
              fill={box.color || "red"}
              fontSize={12 / zoom}
              fontWeight="bold"
            >
              {box.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
