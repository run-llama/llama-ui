import { cn } from "../lib/utils";
import { useId } from "react";

export type LlamaSpinnerProps = {
  /** Optional className for sizing and layout */
  className?: string;
  /** Whether to animate the gradient colors (default: true) */
  animated?: boolean;
  /** Animation duration in seconds (default: 4) */
  duration?: number;
  /** Whether to show drop shadow (default: true) */
  showShadow?: boolean;
};

/**
 * LlamaSpinner - Animated llama logo with gradient color cycling
 *
 * A branded loading indicator featuring the llama mascot with
 * smoothly transitioning gradient colors.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LlamaSpinner className="size-12" />
 *
 * // Static (no animation)
 * <LlamaSpinner animated={false} />
 *
 * // Custom animation speed
 * <LlamaSpinner duration={2} />
 * ```
 */
export function LlamaSpinner({
  className,
  animated = true,
  duration = 4,
  showShadow = true,
}: LlamaSpinnerProps) {
  // Use unique ID to prevent gradient conflicts when multiple spinners render
  const gradientId = useId();

  return (
    <svg
      className={cn(className)}
      viewBox="0 0 61 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={
        showShadow
          ? { filter: "drop-shadow(0 4px 12px rgba(75, 114, 254, 0.3))" }
          : undefined
      }
      aria-hidden="true"
    >
      <path
        d="M54.5504 70.7787C54.5504 70.7787 58.7004 63.8687 48.9904 58.9187C48.9904 58.9187 50.8704 66.3087 46.4704 73.1587H41.9504C41.9504 73.1587 41.7504 71.7188 43.6604 70.9887C47.6604 69.4487 47.8204 62.8787 46.6504 62.0887C43.0804 59.6887 41.6704 57.6387 42.5904 52.4187C42.5904 52.4187 36.4104 54.6787 28.7304 53.7087C28.3304 53.6587 27.9404 53.8487 27.7404 54.1987C27.3304 54.9087 26.5004 56.1887 25.1304 57.6687C25.1304 57.6687 24.7804 61.7587 23.8604 64.6687C23.8604 64.6687 24.2104 69.6487 22.9504 73.1487H17.5504C17.5504 73.1487 17.6104 70.9787 20.2104 70.6987C23.3904 70.3587 19.6404 60.4688 19.6404 60.4688C19.6404 60.4688 19.4804 65.8587 16.2404 73.1287H12.1104C12.1104 73.1287 12.1104 71.0287 14.2104 70.5087C17.6204 69.6587 16.1004 63.5187 15.5504 60.1087C15.0004 56.6888 14.2304 50.2987 11.4404 46.7487C8.65041 43.1987 7.23041 43.2287 7.06041 36.7087C7.06041 36.7087 4.69041 32.9687 5.54041 28.0387C5.54041 28.0387 3.77041 22.1187 6.43041 13.3687C6.43041 13.3687 0.140407 12.0887 0.0204073 10.5287C-0.109593 8.96875 0.360406 7.19875 2.04041 7.04875C3.72041 6.89875 6.18041 6.64875 6.19041 4.87875C6.19041 3.10875 4.05041 0.758747 5.38041 0.068747C6.62041 -0.581253 8.06041 3.60875 9.01041 2.94875C9.63041 2.51875 7.32041 0.258747 8.83041 0.568747C9.45041 0.698747 14.7104 2.43875 16.4904 11.6187C18.2704 20.7987 17.5304 26.9287 20.1004 26.9287C22.6704 26.9287 34.4204 26.4987 41.2804 28.1787C48.1404 29.8587 48.4204 32.4887 51.4304 31.7287C54.4404 30.9687 57.9004 29.1487 59.8604 35.8187C61.5904 41.6887 56.7304 40.9487 56.7304 42.7887C56.7304 44.6287 56.0804 47.4787 56.8204 49.2187C57.5604 50.9587 57.1504 55.1587 57.8004 57.5387C58.4504 59.9188 59.2304 62.0787 57.7604 65.1487C57.7604 65.1487 58.4804 70.3187 56.8604 73.1587H52.9604C52.9604 73.1587 52.6804 71.5387 54.5804 70.7787H54.5504Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="-2.81959"
          y1="2.01875"
          x2="53.9204"
          y2="77.8187"
          gradientUnits="userSpaceOnUse"
        >
          {animated ? (
            <>
              <stop stopColor="#37D7FA">
                <animate
                  attributeName="stop-color"
                  values="#37D7FA; #4B72FE; #FF8DF2; #FF8705; #37D7FA"
                  dur={`${duration}s`}
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="0.33">
                <animate
                  attributeName="stop-color"
                  values="#4B72FE; #FF8DF2; #FF8705; #37D7FA; #4B72FE"
                  dur={`${duration}s`}
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="0.66">
                <animate
                  attributeName="stop-color"
                  values="#FF8DF2; #FF8705; #37D7FA; #4B72FE; #FF8DF2"
                  dur={`${duration}s`}
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="1">
                <animate
                  attributeName="stop-color"
                  values="#FF8705; #37D7FA; #4B72FE; #FF8DF2; #FF8705"
                  dur={`${duration}s`}
                  repeatCount="indefinite"
                />
              </stop>
            </>
          ) : (
            <>
              <stop stopColor="#37D7FA" />
              <stop offset="0.4" stopColor="#4B72FE" />
              <stop offset="0.68" stopColor="#FF8DF2" />
              <stop offset="1" stopColor="#FF8705" />
            </>
          )}
        </linearGradient>
      </defs>
    </svg>
  );
}
