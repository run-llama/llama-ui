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
  highlightStyle = "classic",
}: BoundingBoxOverlayProps) {
  if (containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  const uniqueId = generateId("hl");

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
        {/* Liquid Glass gradient */}
        <linearGradient
          id={`${uniqueId}-liquidGlass-gradient`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
        </linearGradient>

        {/* Liquid Glass shimmer animation */}
        <linearGradient
          id={`${uniqueId}-liquidGlass-shimmer`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0)">
            <animate
              attributeName="offset"
              values="-0.5;1.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.6)">
            <animate
              attributeName="offset"
              values="0;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)">
            <animate
              attributeName="offset"
              values="0.5;2.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Neon glow filter */}
        <filter
          id={`${uniqueId}-neon-glow`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="3" result="blur1" />
          <feGaussianBlur stdDeviation="6" result="blur2" />
          <feGaussianBlur stdDeviation="12" result="blur3" />
          <feMerge>
            <feMergeNode in="blur3" />
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient animation */}
        <linearGradient
          id={`${uniqueId}-gradient-animated`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ff6b6b">
            <animate
              attributeName="stop-color"
              values="#ff6b6b;#feca57;#48dbfb;#ff9ff3;#ff6b6b"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#48dbfb">
            <animate
              attributeName="stop-color"
              values="#48dbfb;#ff9ff3;#ff6b6b;#feca57;#48dbfb"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#ff9ff3">
            <animate
              attributeName="stop-color"
              values="#ff9ff3;#ff6b6b;#feca57;#48dbfb;#ff9ff3"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Spotlight radial gradient */}
        <radialGradient
          id={`${uniqueId}-spotlight-radial`}
          cx="50%"
          cy="50%"
          r="70%"
          fx="50%"
          fy="30%"
        >
          <stop offset="0%" stopColor="rgba(255, 255, 200, 0.3)" />
          <stop offset="40%" stopColor="rgba(255, 255, 150, 0.15)" />
          <stop offset="100%" stopColor="rgba(255, 255, 100, 0)" />
        </radialGradient>

        {/* Glass blur filter for liquid glass */}
        <filter
          id={`${uniqueId}-glass-blur`}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Lightbox overlay - full page darkening except highlight area */}
      {highlightStyle === "lightbox" && boundingBoxes.length > 0 && (
        <>
          <defs>
            <mask id={`${uniqueId}-lightbox-mask`}>
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
                  x={box.x - 8}
                  y={box.y - 8}
                  width={box.width + 16}
                  height={box.height + 16}
                  rx="4"
                  fill="black"
                />
              ))}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(0, 0, 0, 0.6)"
            mask={`url(#${uniqueId}-lightbox-mask)`}
          />
        </>
      )}

      {boundingBoxes.map((box) => (
        <g key={box.id}>
          {renderHighlight(
            box,
            zoom,
            highlightStyle,
            uniqueId,
            onBoundingBoxClick
          )}
          {box.label && (
            <text
              x={box.x}
              y={box.y - 5}
              fill={getLabelColor(highlightStyle)}
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

function getLabelColor(style: HighlightStyle): string {
  switch (style) {
    case "neon":
      return "#00ffff";
    case "gradient":
      return "#ff6b6b";
    case "lightbox":
      return "#ffffff";
    case "spotlight":
      return "#ffdd00";
    case "liquidGlass":
      return "rgba(255, 255, 255, 0.9)";
    default:
      return "rgba(180, 140, 0, 1)";
  }
}

function renderHighlight(
  box: BoundingBox,
  zoom: number,
  style: HighlightStyle,
  uniqueId: string,
  onBoundingBoxClick?: (box: BoundingBox) => void
) {
  const baseProps = {
    style: {
      pointerEvents: "auto" as const,
      cursor: onBoundingBoxClick ? "pointer" : "default",
    },
    onClick: () => onBoundingBoxClick?.(box),
  };

  switch (style) {
    case "classic":
      return (
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill="rgba(255, 215, 0, 0.25)"
          stroke="rgba(255, 180, 0, 0.6)"
          strokeWidth={2 / zoom}
          {...baseProps}
        />
      );

    case "liquidGlass":
      // Apple-inspired Liquid Glass effect
      return (
        <>
          {/* Outer glow/shadow */}
          <rect
            x={box.x - 2}
            y={box.y - 2}
            width={box.width + 4}
            height={box.height + 4}
            rx={12 / zoom}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={8 / zoom}
            filter={`url(#${uniqueId}-glass-blur)`}
          />
          {/* Main glass body */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={10 / zoom}
            fill={`url(#${uniqueId}-liquidGlass-gradient)`}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={1.5 / zoom}
            {...baseProps}
          />
          {/* Inner highlight / refraction */}
          <rect
            x={box.x + 4 / zoom}
            y={box.y + 4 / zoom}
            width={box.width - 8 / zoom}
            height={box.height * 0.4}
            rx={8 / zoom}
            fill="rgba(255, 255, 255, 0.15)"
            style={{ pointerEvents: "none" }}
          />
          {/* Shimmer animation overlay */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={10 / zoom}
            fill={`url(#${uniqueId}-liquidGlass-shimmer)`}
            opacity={0.5}
            style={{ pointerEvents: "none" }}
          />
          {/* Bottom edge highlight */}
          <line
            x1={box.x + 10 / zoom}
            y1={box.y + box.height - 2 / zoom}
            x2={box.x + box.width - 10 / zoom}
            y2={box.y + box.height - 2 / zoom}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={1 / zoom}
            strokeLinecap="round"
          />
        </>
      );

    case "lightbox":
      // Spotlight cutout effect (main mask handled at container level)
      return (
        <>
          {/* Bright inner glow around the cutout */}
          <rect
            x={box.x - 4}
            y={box.y - 4}
            width={box.width + 8}
            height={box.height + 8}
            rx={4}
            fill="none"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth={2 / zoom}
            {...baseProps}
          />
          {/* Subtle inner shadow for depth */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="rgba(255, 255, 255, 0.05)"
            style={{ pointerEvents: "none" }}
          />
        </>
      );

    case "neon":
      // Glowing neon border effect
      return (
        <>
          {/* Glow layer */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={4 / zoom}
            fill="none"
            stroke="#00ffff"
            strokeWidth={3 / zoom}
            filter={`url(#${uniqueId}-neon-glow)`}
            opacity={0.8}
          />
          {/* Core bright line */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={4 / zoom}
            fill="rgba(0, 255, 255, 0.05)"
            stroke="#ffffff"
            strokeWidth={1.5 / zoom}
            {...baseProps}
          />
          {/* Pulsing animation overlay */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={4 / zoom}
            fill="none"
            stroke="#00ffff"
            strokeWidth={2 / zoom}
            opacity={0.6}
            style={{ pointerEvents: "none" }}
          >
            <animate
              attributeName="opacity"
              values="0.6;0.3;0.6"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </rect>
        </>
      );

    case "underline":
      // Minimal underline below content
      return (
        <>
          {/* Invisible hit area for clicks */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="transparent"
            {...baseProps}
          />
          {/* Thick underline */}
          <line
            x1={box.x}
            y1={box.y + box.height + 2}
            x2={box.x + box.width}
            y2={box.y + box.height + 2}
            stroke="#f59e0b"
            strokeWidth={4 / zoom}
            strokeLinecap="round"
          />
          {/* Subtle highlight tint */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="rgba(245, 158, 11, 0.08)"
            style={{ pointerEvents: "none" }}
          />
        </>
      );

    case "outline":
      // Dashed outline, no fill
      return (
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          rx={3 / zoom}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2 / zoom}
          strokeDasharray={`${8 / zoom} ${4 / zoom}`}
          {...baseProps}
        />
      );

    case "gradient":
      // Animated gradient border
      return (
        <>
          {/* Inner subtle fill - aligned with border */}
          <rect
            x={box.x - 2}
            y={box.y - 2}
            width={box.width + 4}
            height={box.height + 4}
            rx={6 / zoom}
            fill="rgba(255, 107, 107, 0.08)"
            style={{ pointerEvents: "none" }}
          />
          {/* Gradient border */}
          <rect
            x={box.x - 2}
            y={box.y - 2}
            width={box.width + 4}
            height={box.height + 4}
            rx={6 / zoom}
            fill="none"
            stroke={`url(#${uniqueId}-gradient-animated)`}
            strokeWidth={4 / zoom}
            {...baseProps}
          />
        </>
      );

    case "spotlight":
      // Radial light beam effect
      return (
        <>
          {/* Outer beam halo */}
          <ellipse
            cx={box.x + box.width / 2}
            cy={box.y + box.height / 2}
            rx={box.width * 0.8}
            ry={box.height * 0.8}
            fill={`url(#${uniqueId}-spotlight-radial)`}
            style={{ pointerEvents: "none" }}
          />
          {/* Main highlight area */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={2 / zoom}
            fill="rgba(255, 250, 200, 0.2)"
            stroke="rgba(255, 220, 100, 0.6)"
            strokeWidth={2 / zoom}
            {...baseProps}
          />
          {/* Top edge light reflection */}
          <line
            x1={box.x + 5 / zoom}
            y1={box.y + 1 / zoom}
            x2={box.x + box.width - 5 / zoom}
            y2={box.y + 1 / zoom}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={1 / zoom}
            strokeLinecap="round"
          />
          {/* Animated light rays */}
          <g opacity={0.3} style={{ pointerEvents: "none" }}>
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={box.x + box.width * 0.2 + (box.width * 0.3 * i)}
                y1={box.y - 20 / zoom}
                x2={box.x + box.width * 0.3 + (box.width * 0.2 * i)}
                y2={box.y + box.height + 20 / zoom}
                stroke="rgba(255, 255, 200, 0.4)"
                strokeWidth={box.width * 0.15}
              >
                <animate
                  attributeName="opacity"
                  values="0.3;0.5;0.3"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${i * 1}s`}
                />
              </line>
            ))}
          </g>
        </>
      );

    default:
      return (
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill={box.color || "rgba(255, 0, 0, 0.2)"}
          stroke={box.color || "red"}
          strokeWidth={2 / zoom}
          {...baseProps}
        />
      );
  }
}
