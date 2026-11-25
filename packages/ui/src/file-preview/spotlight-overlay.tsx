import { useRef } from "react";
import type { BoundingBox } from "./types";
import {
  boxRotationTransform,
  buildSpotlightMaskSvg,
  spotlightBoxes,
} from "./pdf-preview-utils";

const FADE = "opacity 150ms ease";

export interface SpotlightOverlayProps {
  /** Highlights on this page, in page units. Empty veils the whole page. */
  boundingBoxes: BoundingBox[];
  /** Whether the spotlight is on. Off keeps it mounted so it can fade out. */
  active: boolean;
  zoom: number;
  /** Page size in page units. Until known, the veil has no holes. */
  pageDims?: { width: number; height: number };
}

/**
 * Spotlight paint for one page. Must sit inside a positioned element that is
 * exactly the page's size. Draws a veil over the page with holes cut over the
 * highlights, and a ring around each hole.
 */
export function SpotlightOverlay({
  boundingBoxes,
  active,
  zoom,
  pageDims,
}: SpotlightOverlayProps) {
  // Keep the last boxes while fading out, so the area that was sharp does not
  // flash veiled for the length of the fade.
  const shownBoxes = useRef(boundingBoxes);
  if (active) shownBoxes.current = boundingBoxes;
  const boxes = shownBoxes.current;

  const maskSvg = pageDims
    ? buildSpotlightMaskSvg(boxes, pageDims, zoom)
    : null;
  const mask = maskSvg
    ? `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}")`
    : undefined;

  return (
    <>
      <div
        aria-hidden
        data-spotlight-veil={active ? "on" : "off"}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "color-mix(in oklab, var(--background) 55%, transparent)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          opacity: active ? 1 : 0,
          transition: FADE,
          maskImage: mask,
          maskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskImage: mask,
          WebkitMaskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
      {pageDims && (
        <svg
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: pageDims.width * zoom,
            height: pageDims.height * zoom,
            pointerEvents: "none",
            opacity: active ? 1 : 0,
            transition: FADE,
          }}
          viewBox={`0 0 ${pageDims.width} ${pageDims.height}`}
        >
          {spotlightBoxes(boxes, zoom).map((box) => (
            <g key={box.id} transform={boxRotationTransform(box)}>
              {/* Soft glow just outside the ring. */}
              <rect
                x={box.x - 2 / zoom}
                y={box.y - 2 / zoom}
                width={box.width + 4 / zoom}
                height={box.height + 4 / zoom}
                rx={5 / zoom}
                fill="none"
                strokeWidth={3 / zoom}
                style={{ stroke: "var(--primary)", opacity: 0.18 }}
              />
              <rect
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                rx={3 / zoom}
                fill="none"
                strokeWidth={1.5 / zoom}
                style={{ stroke: "var(--primary)" }}
              />
            </g>
          ))}
        </svg>
      )}
    </>
  );
}
