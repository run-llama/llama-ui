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
  const pad = 4;

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
        {/* Clean cutout mask - single layer, no feathering */}
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
              rx="4"
              fill="black"
            />
          ))}
        </mask>

        {/* Light blur for subtle styles */}
        <filter
          id={`${uniqueId}-blur-light`}
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>

        {/* Medium blur */}
        <filter
          id={`${uniqueId}-blur-medium`}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>

        {/* Strong blur for heavy glassmorphism */}
        <filter
          id={`${uniqueId}-blur-strong`}
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>

        {/* Drop shadow filter */}
        <filter
          id={`${uniqueId}-shadow`}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="8"
            floodColor="rgba(0,0,0,0.35)"
          />
        </filter>

        {/* Soft inner shadow for depth */}
        <filter
          id={`${uniqueId}-inner-glow`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feFlood floodColor="rgba(255,255,255,0.6)" result="color" />
          <feComposite in="color" in2="offsetBlur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="glow" />
          </feMerge>
        </filter>

        {/* Specular edge highlight for glass effect */}
        <linearGradient id={`${uniqueId}-specular-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        <linearGradient id={`${uniqueId}-specular-left`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
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
    // MIST - Light blur, barely tinted, very subtle
    // =========================================================================
    case "mist":
      return (
        <>
          {/* Blurred tint overlay */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(200, 200, 210, 0.25)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />
          {/* Clean hairline border */}
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx="4"
              fill="none"
              stroke="rgba(150, 150, 160, 0.3)"
              strokeWidth={1 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // HAZE - Medium blur with slight warmth
    // =========================================================================
    case "haze":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(180, 170, 160, 0.35)"
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
              rx="4"
              fill="none"
              stroke="rgba(160, 140, 120, 0.4)"
              strokeWidth={1.5 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // GLASS - True glassmorphism: blur + specular highlight on edges
    // Inverted: blurs the SURROUNDINGS, highlight stays crisp
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
            fill="rgba(255, 255, 255, 0.5)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-strong)`}
          />
          {/* Specular highlights and shadow on highlight box */}
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              {/* Outer shadow for depth */}
              <rect
                x={box.x - pad - 1}
                y={box.y - pad - 1}
                width={box.width + pad * 2 + 2}
                height={box.height + pad * 2 + 2}
                rx="5"
                fill="none"
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth={4 / zoom}
                filter={`url(#${uniqueId}-blur-light)`}
              />
              {/* Main glass border */}
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="4"
                fill="none"
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth={1.5 / zoom}
                {...clickProps(box)}
              />
              {/* Top specular highlight */}
              <rect
                x={box.x - pad + 6}
                y={box.y - pad + 1}
                width={box.width + pad * 2 - 12}
                height={8}
                rx="2"
                fill={`url(#${uniqueId}-specular-top)`}
                style={{ pointerEvents: "none" }}
              />
              {/* Left specular highlight */}
              <rect
                x={box.x - pad + 1}
                y={box.y - pad + 10}
                width={6}
                height={box.height + pad * 2 - 20}
                rx="2"
                fill={`url(#${uniqueId}-specular-left)`}
                style={{ pointerEvents: "none" }}
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // LOUPE - Magnifying glass: clean center, shadowed edge ring
    // =========================================================================
    case "loupe":
      return (
        <>
          {/* Very subtle blur on surroundings */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(0, 0, 0, 0.06)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              {/* Shadow ring around the loupe */}
              <rect
                x={box.x - pad - 3}
                y={box.y - pad - 2}
                width={box.width + pad * 2 + 6}
                height={box.height + pad * 2 + 6}
                rx="6"
                fill="none"
                stroke="rgba(0, 0, 0, 0.15)"
                strokeWidth={10 / zoom}
                filter={`url(#${uniqueId}-blur-medium)`}
              />
              {/* Inner white edge - light catching the glass */}
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="4"
                fill="none"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth={1.5 / zoom}
                {...clickProps(box)}
              />
              {/* Top reflection streak */}
              <line
                x1={box.x - pad + 10}
                y1={box.y - pad + 2}
                x2={box.x + box.width * 0.5}
                y2={box.y - pad + 2}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth={2 / zoom}
                strokeLinecap="round"
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // SHADOWBOX - Clean cutout with dramatic drop shadow
    // =========================================================================
    case "shadowBox":
      return (
        <>
          {/* Light dim with blur */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(30, 30, 40, 0.15)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-light)`}
          />
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              {/* Strong outer shadow */}
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="4"
                fill="none"
                stroke="transparent"
                filter={`url(#${uniqueId}-shadow)`}
              />
              {/* Subtle inner highlight */}
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="4"
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth={1 / zoom}
                {...clickProps(box)}
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // DIM - Darker cinematic blur, dramatic focus
    // =========================================================================
    case "dim":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(15, 15, 20, 0.55)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-medium)`}
          />
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              {/* Soft glow around highlight */}
              <rect
                x={box.x - pad - 2}
                y={box.y - pad - 2}
                width={box.width + pad * 2 + 4}
                height={box.height + pad * 2 + 4}
                rx="5"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={6 / zoom}
                filter={`url(#${uniqueId}-blur-light)`}
              />
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="4"
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth={1 / zoom}
                {...clickProps(box)}
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // SEPIA - Warm blur, aged/archival feel
    // =========================================================================
    case "sepia":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(160, 130, 90, 0.3)"
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
              rx="3"
              fill="none"
              stroke="rgba(140, 100, 60, 0.4)"
              strokeWidth={1.5 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // FROST - Heavy inverted glassmorphism, frosted window effect
    // =========================================================================
    case "frost":
      return (
        <>
          {/* Dense frost on surroundings */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(240, 245, 250, 0.7)"
            mask={`url(#${uniqueId}-mask)`}
            filter={`url(#${uniqueId}-blur-strong)`}
          />
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              {/* Subtle shadow inset */}
              <rect
                x={box.x - pad - 1}
                y={box.y - pad - 1}
                width={box.width + pad * 2 + 2}
                height={box.height + pad * 2 + 2}
                rx="5"
                fill="none"
                stroke="rgba(100, 120, 140, 0.2)"
                strokeWidth={3 / zoom}
                filter={`url(#${uniqueId}-blur-light)`}
              />
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="4"
                fill="none"
                stroke="rgba(180, 190, 200, 0.6)"
                strokeWidth={1 / zoom}
                {...clickProps(box)}
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // LENS - Non-inverted glass: highlight area has the glass effect
    // The highlight itself is frosted with specular, surroundings stay clear
    // =========================================================================
    case "lens":
      return (
        <>
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              {/* Drop shadow behind the lens */}
              <rect
                x={box.x - pad + 2}
                y={box.y - pad + 4}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="6"
                fill="rgba(0, 0, 0, 0.2)"
                filter={`url(#${uniqueId}-blur-medium)`}
              />
              {/* Frosted glass fill on the highlight */}
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="5"
                fill="rgba(255, 255, 255, 0.15)"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth={1.5 / zoom}
                {...clickProps(box)}
              />
              {/* Top specular band */}
              <rect
                x={box.x - pad + 8}
                y={box.y - pad + 2}
                width={box.width + pad * 2 - 16}
                height={12}
                rx="3"
                fill={`url(#${uniqueId}-specular-top)`}
                style={{ pointerEvents: "none" }}
              />
              {/* Bottom subtle reflection */}
              <rect
                x={box.x - pad + 12}
                y={box.y + box.height + pad - 6}
                width={box.width + pad * 2 - 24}
                height={4}
                rx="2"
                fill="rgba(255, 255, 255, 0.1)"
                style={{ pointerEvents: "none" }}
              />
            </g>
          ))}
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
            fill="rgba(150, 150, 160, 0.2)"
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
              rx="4"
              fill="none"
              stroke="rgba(120, 120, 130, 0.3)"
              strokeWidth={1 / zoom}
              {...clickProps(box)}
            />
          ))}
        </>
      );
  }
}
