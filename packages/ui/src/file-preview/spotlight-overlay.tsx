import { useLayoutEffect, useRef } from "react";
import type { BoundingBox } from "./types";
import {
  boxRotationTransform,
  buildSpotlightMaskSvg,
  spotlightBoxes,
} from "./pdf-preview-utils";

const FADE_IN_MS = 150;
// react-pdf stacks its text layer at 2 and its annotation layer (links, form
// fields) at 3. The veil covers both and the ring sits on top of the veil.
const VEIL_Z_INDEX = 4;
const RING_Z_INDEX = 5;
// A document page is white paper in both themes, so the veil is paper-white
// instead of following the theme background.
const VEIL_COLOR = "rgba(255, 255, 255, 0.6)";

export interface SpotlightOverlayProps {
  /** Highlights on this page, in page units. Empty veils the whole page. */
  boundingBoxes: BoundingBox[];
  zoom: number;
  /** Page size in page units. Until known, the veil has no holes. */
  pageDims?: { width: number; height: number };
}

/**
 * Spotlight paint for one page. Must sit inside a positioned element that is
 * exactly the page's size. Draws a veil over the page with holes cut over the
 * highlights, and a ring around each hole. Mount it only while the spotlight
 * is showing: it fades in on mount, unless the user prefers reduced motion.
 */
export function SpotlightOverlay({
  boundingBoxes,
  zoom,
  pageDims,
}: SpotlightOverlayProps) {
  const veilRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    for (const el of [veilRef.current, ringRef.current]) {
      el?.animate?.([{ opacity: 0 }, { opacity: 1 }], {
        duration: FADE_IN_MS,
        easing: "ease",
      });
    }
  }, []);

  const maskSvg = pageDims
    ? buildSpotlightMaskSvg(boundingBoxes, pageDims, zoom)
    : null;
  const mask = maskSvg
    ? `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}")`
    : undefined;

  return (
    <>
      <div
        ref={veilRef}
        aria-hidden
        data-spotlight-veil
        style={{
          position: "absolute",
          inset: 0,
          zIndex: VEIL_Z_INDEX,
          pointerEvents: "none",
          background: VEIL_COLOR,
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
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
          ref={ringRef}
          aria-hidden
          data-spotlight-ring
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: RING_Z_INDEX,
            width: pageDims.width * zoom,
            height: pageDims.height * zoom,
            pointerEvents: "none",
          }}
          viewBox={`0 0 ${pageDims.width} ${pageDims.height}`}
        >
          {spotlightBoxes(boundingBoxes, zoom).map((box) => (
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
