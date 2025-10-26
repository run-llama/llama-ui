import { useEffect, useState } from "react";
import type { Handler } from "../store/handler";

/**
 * React hook that subscribes to a Handler's internal change notifications
 * and forces the component to re-render when the handler mutates.
 *
 * Useful when a component stores a Handler instance directly in local state
 * (outside of the Zustand store selector lifecycle).
 */
export function useObservedHandler(handler: Handler | null | undefined): Handler | null | undefined {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!handler) return;
    const dispose = handler.onChange(() => {
      // Bump a state value to trigger re-render
      setTick((x) => x + 1);
    });
    return () => dispose();
  }, [handler]);

  return handler ?? null;
}


