import type { BoundingBox, HighlightStyle } from "./types";

export interface BoundingBoxOverlayProps {
  boundingBoxes: BoundingBox[];
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  onBoundingBoxClick?: (box: BoundingBox) => void;
  highlightStyle?: HighlightStyle;
}

// Generate unique IDs for SVG elements to avoid conflicts
let idCounter = 0;
const generateId = (prefix: string) => `${prefix}-${++idCounter}`;

// Bezel radius for glass effects - large to show off the bezel
const BEZEL_RADIUS = 16;

export function BoundingBoxOverlay({
  boundingBoxes,
  zoom,
  containerWidth,
  containerHeight,
  onBoundingBoxClick,
  highlightStyle = "mist",
}: BoundingBoxOverlayProps) {
  if (containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  const uniqueId = generateId("hl");
  const pad = 8; // Slightly larger padding for bezel room

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: containerWidth * zoom,
        height: containerHeight * zoom,
        pointerEvents: "none",
        overflow: "visible",
      }}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    >
      <defs>
        {/* Clean cutout mask - uses large radius */}
        <mask id={`${uniqueId}-mask`}>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="white"
          />
          {boundingBoxes.map((box) => (
            <rect
              key={`mask-${box.id}`}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx={BEZEL_RADIUS}
              fill="black"
            />
          ))}
        </mask>

        {/* Blur filters */}
        <filter id={`${uniqueId}-blur-light`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>

        <filter id={`${uniqueId}-blur-medium`} x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>

        <filter id={`${uniqueId}-blur-strong`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>

        <filter id={`${uniqueId}-blur-extreme`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
        </filter>

        {/* Heavy drop shadow for glass depth */}
        <filter id={`${uniqueId}-glass-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="12" floodColor="rgba(0,0,0,0.4)" />
        </filter>

        {/* Soft shadow for subtle depth */}
        <filter id={`${uniqueId}-soft-shadow`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
        </filter>

        {/* ===== BEZEL SPECULAR GRADIENTS - ANGLED LIGHT ===== */}

        {/* Top-left bezel - bright specular at angle (light from top-left) */}
        <linearGradient id={`${uniqueId}-bezel-top`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,1)" />
          <stop offset="20%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Left bezel - bright specular at angle */}
        <linearGradient id={`${uniqueId}-bezel-left`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="20%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Bottom bezel - dark shadow at angle (opposite of light) */}
        <linearGradient id={`${uniqueId}-bezel-bottom`} x1="0.3" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="50%" stopColor="rgba(0,0,0,0.2)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </linearGradient>

        {/* Right bezel - dark shadow at angle */}
        <linearGradient id={`${uniqueId}-bezel-right`} x1="0" y1="0.3" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="50%" stopColor="rgba(0,0,0,0.18)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
        </linearGradient>

        {/* Diagonal specular - bright streak from top-left */}
        <linearGradient id={`${uniqueId}-specular-diagonal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="15%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Diagonal shadow - dark from bottom-right */}
        <linearGradient id={`${uniqueId}-shadow-diagonal`} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
          <stop offset="15%" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="35%" stopColor="rgba(0,0,0,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>

        {/* Corner highlight - top-left bright corner */}
        <radialGradient id={`${uniqueId}-corner-highlight`} cx="0%" cy="0%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,1)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* Corner shadow - bottom-right dark corner */}
        <radialGradient id={`${uniqueId}-corner-shadow`} cx="100%" cy="100%" r="70%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
          <stop offset="30%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {renderStyle(
        highlightStyle,
        uniqueId,
        containerWidth,
        containerHeight,
        boundingBoxes,
        pad,
        zoom,
        onBoundingBoxClick
      )}
    </svg>
  );
}

function renderStyle(
  style: HighlightStyle,
  uniqueId: string,
  containerWidth: number,
  containerHeight: number,
  boundingBoxes: BoundingBox[],
  pad: number,
  zoom: number,
  onBoundingBoxClick?: (box: BoundingBox) => void
) {
  const clickProps = (box: BoundingBox) => ({
    style: {
      pointerEvents: "auto" as const,
      cursor: onBoundingBoxClick ? "pointer" : "default",
    },
    onClick: () => onBoundingBoxClick?.(box),
  });

  switch (style) {
    // =========================================================================
    // MIST - Light blur, subtle
    // =========================================================================
    case "mist":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(180, 180, 190, 0.3)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx={BEZEL_RADIUS}
              fill="none"
              stroke="rgba(120, 120, 130, 0.2)"
              strokeWidth={0.5 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // HAZE - Medium blur with warmth
    // =========================================================================
    case "haze":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(170, 155, 140, 0.4)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-medium)`}
          />
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx={BEZEL_RADIUS}
              fill="none"
              stroke="rgba(140, 120, 100, 0.25)"
              strokeWidth={0.5 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // GLASS - Strong bezel with angled specular highlights
    // Light from top-left (bright), shadow on bottom-right (dark)
    // Clear center - no graying of the highlight area
    // =========================================================================
    case "glass":
      return (
        <>
          {/* Frosted blur on surroundings only */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(245, 245, 250, 0.6)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-strong)`}
          />

          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;
            const bezelWidth = 20; // Thick bezel

            return (
              <g key={box.id}>
                {/* Clickable transparent area */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill="transparent"
                  {...clickProps(box)}
                />

                {/* TOP BEZEL - bright specular, angled */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-top)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* LEFT BEZEL - bright specular, angled */}
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-left)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* BOTTOM BEZEL - dark shadow, angled */}
                <rect
                  x={bx}
                  y={by + bh - bezelWidth}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-bottom)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* RIGHT BEZEL - dark shadow, angled */}
                <rect
                  x={bx + bw - bezelWidth}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-right)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* TOP-LEFT CORNER - extra bright highlight */}
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth * 2}
                  height={bezelWidth * 2}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-corner-highlight)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* BOTTOM-RIGHT CORNER - extra dark shadow */}
                <rect
                  x={bx + bw - bezelWidth * 2}
                  y={by + bh - bezelWidth * 2}
                  width={bezelWidth * 2}
                  height={bezelWidth * 2}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-corner-shadow)`}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // LOUPE - Magnifying glass with pronounced bezel
    // Heavier bezel, more dramatic light/shadow contrast
    // =========================================================================
    case "loupe":
      return (
        <>
          {/* Very subtle dim on surroundings */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(0, 0, 0, 0.06)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />

          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;
            const bezelWidth = 24; // Extra thick bezel for loupe effect

            return (
              <g key={box.id}>
                {/* Outer soft shadow - depth */}
                <rect
                  x={bx + 4}
                  y={by + 6}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS + 2}
                  fill="rgba(0,0,0,0.2)"
                  filter={`url(#${uniqueId}-blur-medium)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Clickable transparent area */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill="transparent"
                  {...clickProps(box)}
                />

                {/* TOP BEZEL - very bright, thick */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-top)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* LEFT BEZEL - very bright, thick */}
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-left)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* BOTTOM BEZEL - very dark, thick */}
                <rect
                  x={bx}
                  y={by + bh - bezelWidth}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-bottom)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* RIGHT BEZEL - very dark, thick */}
                <rect
                  x={bx + bw - bezelWidth}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-right)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Diagonal specular streak across top-left corner */}
                <rect
                  x={bx}
                  y={by}
                  width={bw * 0.6}
                  height={bh * 0.4}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-specular-diagonal)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Diagonal shadow in bottom-right corner */}
                <rect
                  x={bx + bw * 0.4}
                  y={by + bh * 0.6}
                  width={bw * 0.6}
                  height={bh * 0.4}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-shadow-diagonal)`}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // SHADOWBOX - Clean cutout with dramatic shadow, uses bezel
    // =========================================================================
    case "shadowBox":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(25, 25, 35, 0.25)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />
          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;
            const bezelWidth = 16;

            return (
              <g key={box.id}>
                {/* Heavy shadow */}
                <rect
                  x={bx + 4}
                  y={by + 5}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill="rgba(0,0,0,0.25)"
                  filter={`url(#${uniqueId}-blur-medium)`}
                />

                {/* Clickable area */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill="transparent"
                  {...clickProps(box)}
                />

                {/* Subtle bezel - light top-left */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-top)`}
                  opacity={0.5}
                  style={{ pointerEvents: "none" }}
                />
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-left)`}
                  opacity={0.5}
                  style={{ pointerEvents: "none" }}
                />

                {/* Subtle bezel - dark bottom-right */}
                <rect
                  x={bx}
                  y={by + bh - bezelWidth}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-bottom)`}
                  opacity={0.6}
                  style={{ pointerEvents: "none" }}
                />
                <rect
                  x={bx + bw - bezelWidth}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-right)`}
                  opacity={0.6}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // DIM - Dark cinematic blur with bezel
    // =========================================================================
    case "dim":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(10, 10, 15, 0.6)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-medium)`}
          />
          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;
            const bezelWidth = 14;

            return (
              <g key={box.id}>
                {/* Soft glow around cutout */}
                <rect
                  x={bx - 2}
                  y={by - 2}
                  width={bw + 4}
                  height={bh + 4}
                  rx={BEZEL_RADIUS + 2}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={6 / zoom}
                  filter={`url(#${uniqueId}-blur-light)`}
                />

                {/* Clickable area */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill="transparent"
                  {...clickProps(box)}
                />

                {/* Bezel - light on top-left */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-top)`}
                  opacity={0.4}
                  style={{ pointerEvents: "none" }}
                />
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-left)`}
                  opacity={0.4}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // SEPIA - Warm blur, archival feel with subtle bezel
    // =========================================================================
    case "sepia":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(150, 120, 80, 0.35)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-medium)`}
          />
          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;
            const bezelWidth = 12;

            return (
              <g key={box.id}>
                {/* Clickable area */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill="transparent"
                  {...clickProps(box)}
                />

                {/* Very subtle warm bezel */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-top)`}
                  opacity={0.35}
                  style={{ pointerEvents: "none" }}
                />
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-left)`}
                  opacity={0.35}
                  style={{ pointerEvents: "none" }}
                />
                <rect
                  x={bx}
                  y={by + bh - bezelWidth}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-bottom)`}
                  opacity={0.4}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // FROST - Heavy frost with soft bezel
    // More diffuse/soft bezel edges, heavier blur on surroundings
    // =========================================================================
    case "frost":
      return (
        <>
          {/* Dense white frost on surroundings */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(250, 252, 255, 0.8)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-extreme)`}
          />

          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;
            const bezelWidth = 18;

            return (
              <g key={box.id}>
                {/* Clickable transparent area */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill="transparent"
                  {...clickProps(box)}
                />

                {/* TOP BEZEL - softer bright, blurred */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-top)`}
                  filter={`url(#${uniqueId}-blur-light)`}
                  opacity={0.85}
                  style={{ pointerEvents: "none" }}
                />

                {/* LEFT BEZEL - softer bright, blurred */}
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-left)`}
                  filter={`url(#${uniqueId}-blur-light)`}
                  opacity={0.85}
                  style={{ pointerEvents: "none" }}
                />

                {/* BOTTOM BEZEL - softer dark, blurred */}
                <rect
                  x={bx}
                  y={by + bh - bezelWidth}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-bottom)`}
                  filter={`url(#${uniqueId}-blur-light)`}
                  opacity={0.9}
                  style={{ pointerEvents: "none" }}
                />

                {/* RIGHT BEZEL - softer dark, blurred */}
                <rect
                  x={bx + bw - bezelWidth}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-right)`}
                  filter={`url(#${uniqueId}-blur-light)`}
                  opacity={0.9}
                  style={{ pointerEvents: "none" }}
                />

                {/* Corner highlight - softer */}
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth * 2}
                  height={bezelWidth * 2}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-corner-highlight)`}
                  opacity={0.7}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // LENS - Non-inverted: Glass bezel ON the highlight itself
    // No inversion/dimming, just the bezel effect directly on the highlight
    // =========================================================================
    case "lens":
      return (
        <>
          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;
            const bezelWidth = 22;

            return (
              <g key={box.id}>
                {/* Drop shadow - glass floats above page */}
                <rect
                  x={bx + 5}
                  y={by + 7}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS + 2}
                  fill="rgba(0, 0, 0, 0.3)"
                  filter={`url(#${uniqueId}-blur-strong)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Clickable transparent area */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill="transparent"
                  {...clickProps(box)}
                />

                {/* TOP BEZEL - bright specular */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-top)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* LEFT BEZEL - bright specular */}
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-left)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* BOTTOM BEZEL - dark shadow */}
                <rect
                  x={bx}
                  y={by + bh - bezelWidth}
                  width={bw}
                  height={bezelWidth}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-bottom)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* RIGHT BEZEL - dark shadow */}
                <rect
                  x={bx + bw - bezelWidth}
                  y={by}
                  width={bezelWidth}
                  height={bh}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-bezel-right)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* TOP-LEFT CORNER - extra bright */}
                <rect
                  x={bx}
                  y={by}
                  width={bezelWidth * 1.8}
                  height={bezelWidth * 1.8}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-corner-highlight)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* BOTTOM-RIGHT CORNER - extra dark */}
                <rect
                  x={bx + bw - bezelWidth * 1.8}
                  y={by + bh - bezelWidth * 1.8}
                  width={bezelWidth * 1.8}
                  height={bezelWidth * 1.8}
                  rx={BEZEL_RADIUS}
                  fill={`url(#${uniqueId}-corner-shadow)`}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // Default fallback - same as mist
    default:
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(140, 140, 150, 0.25)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx={BEZEL_RADIUS}
              fill="transparent"
              {...clickProps(box)}
            />
          ))}
        </>
      );
  }
}
