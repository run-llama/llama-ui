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
  const pad = 6;

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
        {/* Clean cutout mask */}
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
              rx="6"
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

        {/* ===== SPECULAR GRADIENTS FOR GLASS ===== */}

        {/* Top specular - bright highlight simulating light from above */}
        <linearGradient id={`${uniqueId}-specular-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Left edge specular */}
        <linearGradient id={`${uniqueId}-specular-left`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Bottom edge - darker, simulates thickness */}
        <linearGradient id={`${uniqueId}-bottom-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="60%" stopColor="rgba(0,0,0,0.1)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
        </linearGradient>

        {/* Right edge - subtle shadow */}
        <linearGradient id={`${uniqueId}-right-edge`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="60%" stopColor="rgba(0,0,0,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
        </linearGradient>

        {/* Inner vignette for curved glass surface simulation */}
        <radialGradient id={`${uniqueId}-inner-vignette`} cx="50%" cy="30%" r="80%" fx="50%" fy="20%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
        </radialGradient>

        {/* Refraction edge gradient - simulates light bending at glass edges */}
        <linearGradient id={`${uniqueId}-refract-edge`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(200,220,255,0.3)" />
          <stop offset="15%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="85%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(200,220,255,0.3)" />
        </linearGradient>
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
              rx="6"
              fill="none"
              stroke="rgba(120, 120, 130, 0.25)"
              strokeWidth={1 / zoom}
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
              rx="6"
              fill="none"
              stroke="rgba(140, 120, 100, 0.35)"
              strokeWidth={1.5 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // GLASS - Inverted glassmorphism with strong refraction cues
    // Blurs surroundings, crisp center with pronounced specular edges
    // =========================================================================
    case "glass":
      return (
        <>
          {/* Frosted blur on surroundings */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(255, 255, 255, 0.55)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-strong)`}
          />

          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;

            return (
              <g key={box.id}>
                {/* Outer shadow - glass has depth */}
                <rect
                  x={bx - 2}
                  y={by}
                  width={bw + 4}
                  height={bh + 4}
                  rx="8"
                  fill="rgba(0,0,0,0.15)"
                  filter={`url(#${uniqueId}-blur-medium)`}
                />

                {/* Main border - white glass edge */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx="6"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth={2 / zoom}
                  {...clickProps(box)}
                />

                {/* TOP SPECULAR - bright band */}
                <rect
                  x={bx + 4}
                  y={by}
                  width={bw - 8}
                  height={18}
                  rx="4"
                  fill={`url(#${uniqueId}-specular-top)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* LEFT SPECULAR - vertical highlight */}
                <rect
                  x={bx}
                  y={by + 12}
                  width={12}
                  height={bh - 24}
                  rx="3"
                  fill={`url(#${uniqueId}-specular-left)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* BOTTOM EDGE - darker, thickness */}
                <rect
                  x={bx + 8}
                  y={by + bh - 10}
                  width={bw - 16}
                  height={10}
                  rx="3"
                  fill={`url(#${uniqueId}-bottom-edge)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* RIGHT EDGE - subtle shadow */}
                <rect
                  x={bx + bw - 10}
                  y={by + 12}
                  width={10}
                  height={bh - 24}
                  rx="3"
                  fill={`url(#${uniqueId}-right-edge)`}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // LOUPE - Magnifying glass with heavy shadow ring and refraction edge
    // =========================================================================
    case "loupe":
      return (
        <>
          {/* Subtle dim on surroundings */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(0, 0, 0, 0.08)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />

          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;

            return (
              <g key={box.id}>
                {/* Heavy blurred shadow ring - the "lens rim" */}
                <rect
                  x={bx - 4}
                  y={by - 2}
                  width={bw + 8}
                  height={bh + 8}
                  rx="10"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.25)"
                  strokeWidth={16 / zoom}
                  filter={`url(#${uniqueId}-blur-strong)`}
                />

                {/* Secondary shadow ring - tighter */}
                <rect
                  x={bx - 1}
                  y={by - 1}
                  width={bw + 2}
                  height={bh + 2}
                  rx="7"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.12)"
                  strokeWidth={6 / zoom}
                  filter={`url(#${uniqueId}-blur-light)`}
                />

                {/* Inner white edge - bright, catching light */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx="6"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth={2.5 / zoom}
                  {...clickProps(box)}
                />

                {/* Top specular streak - prominent */}
                <rect
                  x={bx + 8}
                  y={by + 2}
                  width={bw * 0.6}
                  height={6}
                  rx="3"
                  fill="rgba(255, 255, 255, 0.85)"
                  filter={`url(#${uniqueId}-blur-light)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Refraction edge hint - subtle color shift */}
                <rect
                  x={bx + 2}
                  y={by + bh - 4}
                  width={bw - 4}
                  height={4}
                  rx="2"
                  fill={`url(#${uniqueId}-refract-edge)`}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // SHADOWBOX - Clean cutout with dramatic shadow
    // =========================================================================
    case "shadowBox":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(25, 25, 35, 0.2)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="6"
                fill="none"
                stroke="rgba(0,0,0,0.03)"
                filter={`url(#${uniqueId}-glass-shadow)`}
              />
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="6"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1 / zoom}
                {...clickProps(box)}
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // DIM - Dark cinematic blur
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
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              <rect
                x={box.x - pad - 3}
                y={box.y - pad - 3}
                width={box.width + pad * 2 + 6}
                height={box.height + pad * 2 + 6}
                rx="8"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={8 / zoom}
                filter={`url(#${uniqueId}-blur-light)`}
              />
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="6"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={1.5 / zoom}
                {...clickProps(box)}
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // SEPIA - Warm blur, archival feel
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
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx="5"
              fill="none"
              stroke="rgba(130, 95, 55, 0.45)"
              strokeWidth={1.5 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // FROST - Heavy inverted glassmorphism, very frosted
    // =========================================================================
    case "frost":
      return (
        <>
          {/* Dense white frost */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(250, 252, 255, 0.75)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-extreme)`}
          />

          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;

            return (
              <g key={box.id}>
                {/* Outer shadow for depth */}
                <rect
                  x={bx - 2}
                  y={by}
                  width={bw + 4}
                  height={bh + 5}
                  rx="8"
                  fill="rgba(100, 120, 150, 0.15)"
                  filter={`url(#${uniqueId}-blur-medium)`}
                />

                {/* Clean border */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx="6"
                  fill="none"
                  stroke="rgba(180, 190, 210, 0.7)"
                  strokeWidth={1.5 / zoom}
                  {...clickProps(box)}
                />

                {/* Top highlight */}
                <rect
                  x={bx + 6}
                  y={by + 1}
                  width={bw - 12}
                  height={12}
                  rx="4"
                  fill={`url(#${uniqueId}-specular-top)`}
                  opacity={0.6}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // =========================================================================
    // LENS - Non-inverted: Glass effect ON the highlight itself
    // Strong visual glass cues - shadow, specular, refraction gradient
    // =========================================================================
    case "lens":
      return (
        <>
          {boundingBoxes.map((box) => {
            const bx = box.x - pad;
            const by = box.y - pad;
            const bw = box.width + pad * 2;
            const bh = box.height + pad * 2;

            return (
              <g key={box.id}>
                {/* Heavy drop shadow - glass floats above */}
                <rect
                  x={bx + 3}
                  y={by + 6}
                  width={bw}
                  height={bh}
                  rx="8"
                  fill="rgba(0, 0, 0, 0.35)"
                  filter={`url(#${uniqueId}-blur-strong)`}
                />

                {/* Glass body - semi-transparent with inner vignette */}
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                  rx="6"
                  fill={`url(#${uniqueId}-inner-vignette)`}
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth={2 / zoom}
                  {...clickProps(box)}
                />

                {/* TOP SPECULAR - very bright, prominent */}
                <rect
                  x={bx + 6}
                  y={by + 2}
                  width={bw - 12}
                  height={20}
                  rx="4"
                  fill={`url(#${uniqueId}-specular-top)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Left specular edge */}
                <rect
                  x={bx + 2}
                  y={by + 16}
                  width={14}
                  height={bh - 32}
                  rx="4"
                  fill={`url(#${uniqueId}-specular-left)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Bottom dark edge - thickness illusion */}
                <rect
                  x={bx + 10}
                  y={by + bh - 12}
                  width={bw - 20}
                  height={12}
                  rx="4"
                  fill={`url(#${uniqueId}-bottom-edge)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Right shadow edge */}
                <rect
                  x={bx + bw - 14}
                  y={by + 16}
                  width={12}
                  height={bh - 32}
                  rx="4"
                  fill={`url(#${uniqueId}-right-edge)`}
                  style={{ pointerEvents: "none" }}
                />

                {/* Refraction color hint at bottom edge */}
                <rect
                  x={bx + 4}
                  y={by + bh - 3}
                  width={bw - 8}
                  height={3}
                  rx="1.5"
                  fill="rgba(180, 200, 255, 0.25)"
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </>
      );

    // Default fallback
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
              rx="6"
              fill="none"
              stroke="rgba(100, 100, 110, 0.3)"
              strokeWidth={1 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );
  }
}
