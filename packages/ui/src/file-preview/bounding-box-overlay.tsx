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
  highlightStyle = "veil",
}: BoundingBoxOverlayProps) {
  if (containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  const uniqueId = generateId("hl");

  // Common padding around highlight cutouts
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
        {/* Base mask for all lightbox-style effects - cutouts for highlights */}
        <mask id={`${uniqueId}-cutout-mask`}>
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
              rx="3"
              fill="black"
            />
          ))}
        </mask>

        {/* Soft feathered mask for gentler transitions */}
        <mask id={`${uniqueId}-soft-mask`}>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="white"
          />
          {boundingBoxes.map((box) => (
            <g key={`soft-mask-${box.id}`}>
              {/* Feathered edge using multiple rects with decreasing opacity */}
              <rect
                x={box.x - pad - 20}
                y={box.y - pad - 20}
                width={box.width + pad * 2 + 40}
                height={box.height + pad * 2 + 40}
                rx="8"
                fill="rgba(0,0,0,0.3)"
              />
              <rect
                x={box.x - pad - 12}
                y={box.y - pad - 12}
                width={box.width + pad * 2 + 24}
                height={box.height + pad * 2 + 24}
                rx="5"
                fill="rgba(0,0,0,0.6)"
              />
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="3"
                fill="black"
              />
            </g>
          ))}
        </mask>

        {/* Blur filter for frost effect */}
        <filter
          id={`${uniqueId}-frost-blur`}
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>

        {/* Loupe edge shadow filter */}
        <filter
          id={`${uniqueId}-loupe-shadow`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="3"
            floodColor="rgba(0,0,0,0.25)"
          />
        </filter>

        {/* Inner shadow for loupe depth */}
        <filter
          id={`${uniqueId}-inner-shadow`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feComponentTransfer in="SourceAlpha">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="4" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feFlood floodColor="rgba(0,0,0,0.3)" result="color" />
          <feComposite in2="offsetblur" operator="in" />
          <feComposite in2="SourceAlpha" operator="in" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode />
          </feMerge>
        </filter>

        {/* Sepia color matrix */}
        <filter id={`${uniqueId}-sepia`}>
          <feColorMatrix
            type="matrix"
            values="0.393 0.769 0.189 0 0
                    0.349 0.686 0.168 0 0
                    0.272 0.534 0.131 0 0
                    0     0     0     1 0"
          />
        </filter>
      </defs>

      {/* Render the appropriate style overlay */}
      {renderOverlay(
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

function renderOverlay(
  style: HighlightStyle,
  uniqueId: string,
  containerWidth: number,
  containerHeight: number,
  boundingBoxes: BoundingBox[],
  pad: number,
  zoom: number,
  onBoundingBoxClick?: (box: BoundingBox) => void
) {
  const baseClickProps = (box: BoundingBox) => ({
    style: {
      pointerEvents: "auto" as const,
      cursor: onBoundingBoxClick ? "pointer" : "default",
    },
    onClick: () => onBoundingBoxClick?.(box),
  });

  switch (style) {
    // =========================================================================
    // VEIL - Subtle light gray wash, barely perceptible
    // =========================================================================
    case "veil":
      return (
        <>
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(120, 120, 130, 0.12)"
            mask={`url(#${uniqueId}-soft-mask)`}
          />
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx="3"
              fill="transparent"
              stroke="rgba(100, 100, 110, 0.15)"
              strokeWidth={1 / zoom}
              {...baseClickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // SEPIA - Warm aged paper tone on surroundings, timeless feel
    // =========================================================================
    case "sepia":
      return (
        <>
          {/* Warm sepia overlay on non-highlighted areas */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(180, 140, 90, 0.18)"
            mask={`url(#${uniqueId}-soft-mask)`}
          />
          {/* Subtle warm border around highlight */}
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx="2"
              fill="transparent"
              stroke="rgba(160, 120, 60, 0.25)"
              strokeWidth={1.5 / zoom}
              {...baseClickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // LOUPE - Magnifying glass effect: edge shadow, clean center
    // =========================================================================
    case "loupe":
      return (
        <>
          {/* Very subtle surrounding dim */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(0, 0, 0, 0.04)"
            mask={`url(#${uniqueId}-cutout-mask)`}
          />
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              {/* Outer lens ring with shadow */}
              <rect
                x={box.x - pad - 2}
                y={box.y - pad - 2}
                width={box.width + pad * 2 + 4}
                height={box.height + pad * 2 + 4}
                rx="4"
                fill="none"
                stroke="rgba(0, 0, 0, 0.08)"
                strokeWidth={6 / zoom}
                filter={`url(#${uniqueId}-loupe-shadow)`}
              />
              {/* Inner bright edge - like light catching glass */}
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="3"
                fill="none"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth={1 / zoom}
                {...baseClickProps(box)}
              />
              {/* Top-left highlight reflection */}
              <line
                x1={box.x - pad + 8}
                y1={box.y - pad + 1}
                x2={box.x - pad + box.width * 0.4}
                y2={box.y - pad + 1}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={1 / zoom}
                strokeLinecap="round"
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // FROST - Frosted glass on surroundings (inverted glassmorphism)
    // =========================================================================
    case "frost":
      return (
        <>
          {/* Frosted overlay - white with blur effect simulation */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(245, 247, 250, 0.65)"
            mask={`url(#${uniqueId}-cutout-mask)`}
          />
          {/* Subtle grain texture simulation */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(255, 255, 255, 0.1)"
            mask={`url(#${uniqueId}-cutout-mask)`}
            style={{ mixBlendMode: "overlay" }}
          />
          {/* Clean edge around highlight */}
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx="3"
              fill="none"
              stroke="rgba(200, 205, 215, 0.5)"
              strokeWidth={1 / zoom}
              {...baseClickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // PARCHMENT - Aged paper effect, scholarly feel
    // =========================================================================
    case "parchment":
      return (
        <>
          {/* Aged paper tone */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(235, 220, 195, 0.35)"
            mask={`url(#${uniqueId}-soft-mask)`}
          />
          {/* Subtle darkening at edges for depth */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(150, 120, 80, 0.08)"
            mask={`url(#${uniqueId}-cutout-mask)`}
          />
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx="2"
              fill="none"
              stroke="rgba(140, 110, 70, 0.2)"
              strokeWidth={1 / zoom}
              strokeDasharray={`${4 / zoom} ${2 / zoom}`}
              {...baseClickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // INKWASH - Deep blue-black like watercolor ink, elegant
    // =========================================================================
    case "inkWash":
      return (
        <>
          {/* Deep ink wash */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(25, 35, 55, 0.25)"
            mask={`url(#${uniqueId}-soft-mask)`}
          />
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx="2"
              fill="none"
              stroke="rgba(40, 55, 80, 0.3)"
              strokeWidth={1.5 / zoom}
              {...baseClickProps(box)}
            />
          ))}
        </>
      );

    // =========================================================================
    // EMBER - Warm, focused glow like reading by firelight
    // =========================================================================
    case "ember":
      return (
        <>
          {/* Warm dark surround */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(45, 30, 25, 0.3)"
            mask={`url(#${uniqueId}-soft-mask)`}
          />
          {/* Subtle warm glow at highlight edges */}
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              <rect
                x={box.x - pad - 8}
                y={box.y - pad - 8}
                width={box.width + pad * 2 + 16}
                height={box.height + pad * 2 + 16}
                rx="6"
                fill="none"
                stroke="rgba(255, 180, 100, 0.1)"
                strokeWidth={12 / zoom}
              />
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="3"
                fill="none"
                stroke="rgba(255, 200, 140, 0.25)"
                strokeWidth={1 / zoom}
                {...baseClickProps(box)}
              />
            </g>
          ))}
        </>
      );

    // =========================================================================
    // DEPTH - Strong focus effect, dramatic but refined
    // =========================================================================
    case "depth":
      return (
        <>
          {/* Darker overlay for strong focus */}
          <rect
            x="0"
            y="0"
            width={containerWidth}
            height={containerHeight}
            fill="rgba(20, 22, 28, 0.5)"
            mask={`url(#${uniqueId}-soft-mask)`}
          />
          {boundingBoxes.map((box) => (
            <g key={box.id}>
              {/* Subtle glow around highlight */}
              <rect
                x={box.x - pad - 4}
                y={box.y - pad - 4}
                width={box.width + pad * 2 + 8}
                height={box.height + pad * 2 + 8}
                rx="5"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={8 / zoom}
              />
              <rect
                x={box.x - pad}
                y={box.y - pad}
                width={box.width + pad * 2}
                height={box.height + pad * 2}
                rx="3"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1 / zoom}
                {...baseClickProps(box)}
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
            fill="rgba(100, 100, 110, 0.15)"
            mask={`url(#${uniqueId}-soft-mask)`}
          />
          {boundingBoxes.map((box) => (
            <rect
              key={box.id}
              x={box.x - pad}
              y={box.y - pad}
              width={box.width + pad * 2}
              height={box.height + pad * 2}
              rx="3"
              fill="transparent"
              {...baseClickProps(box)}
            />
          ))}
        </>
      );
  }
}
