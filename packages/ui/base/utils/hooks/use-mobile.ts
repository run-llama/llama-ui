import * as React from "react";

/** Default mobile breakpoint matching Tailwind's md breakpoint (768px) */
export const DEFAULT_MOBILE_BREAKPOINT = 768;

export const LG_BREAKPOINT = 1024;

/**
 * Hook to detect if the viewport is below a given breakpoint.
 * @param breakpoint - Width threshold in pixels (defaults to 768px / md breakpoint)
 * @returns true if viewport width is below the breakpoint
 */
export function useIsMobile(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    mql.addEventListener("change", onChange);

    setIsMobile(window.innerWidth < breakpoint);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return !!isMobile;
}
