import React from "react";

export interface StreamEventBatcher<T> {
  items: T[];
  push: (item: T) => void;
  clear: () => void;
}

export function useStreamEventBatcher<T>(pushIntervalMs = 100, sort?: (a: T, b: T) => number): StreamEventBatcher<T> {
  const bufferRef = React.useRef<T[]>([]);
  const [items, setItems] = React.useState<T[]>([]);

  // Only push to buffer, don't trigger render
  const push = React.useCallback((item: T) => {
    bufferRef.current.push(item);
  }, []);

  // Clear function with stable reference
  const clear = React.useCallback(() => {
    bufferRef.current = [];
    setItems([]);
  }, []);

  // Submit buffer to React at a fixed frequency
  React.useEffect(() => {
    const id = setInterval(() => {
      const buf = bufferRef.current;
      if (buf.length === 0) return;
      // Merge buffer into a single setState
      setItems(prev => [...prev, ...buf].sort(sort));
      bufferRef.current = [];
    }, pushIntervalMs);
    return () => clearInterval(id);
  }, [pushIntervalMs, sort]);

  return { items, push, clear };
}