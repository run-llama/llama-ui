"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.25;

interface PreviewControlsOptions {
  /** Extra key handlers (e.g. ArrowLeft/ArrowRight for page navigation). */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** When both `scale` and `onScaleChange` are provided, the hook runs in
   *  controlled mode and defers to the parent for zoom state. Otherwise it
   *  manages scale internally. */
  scale?: number;
  onScaleChange?: (scale: number) => void;
}

export interface PreviewControls {
  scale: number;
  setScale: (scale: number) => void;
  resetScale: () => void;
  toggleFullscreen: () => void;
}

/**
 * Shared zoom / fullscreen / keyboard scaffolding used by every
 * preview component (HTML, DOCX, PPTX). Keeps behavior identical
 * across formats so the toolbar UI stays consistent.
 */
export function usePreviewControls(
  containerRef: RefObject<HTMLElement | null>,
  options: PreviewControlsOptions = {}
): PreviewControls {
  const {
    onKeyDown: onExtraKeyDown,
    scale: scaleProp,
    onScaleChange,
  } = options;
  const isControlled = scaleProp !== undefined && onScaleChange !== undefined;

  const [internalScale, setInternalScale] = useState(1);
  const scale = isControlled ? scaleProp : internalScale;

  const setScale = useCallback(
    (next: number) => {
      if (isControlled) {
        onScaleChange!(next);
      } else {
        setInternalScale(next);
      }
    },
    [isControlled, onScaleChange]
  );

  const resetScale = useCallback(() => setScale(1), [setScale]);

  const toggleFullscreen = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen?.();
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        setScale(Math.min(scale + ZOOM_STEP, ZOOM_MAX));
      } else if (event.key === "-") {
        event.preventDefault();
        setScale(Math.max(scale - ZOOM_STEP, ZOOM_MIN));
      } else {
        onExtraKeyDown?.(event);
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.tabIndex = 0;

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, onExtraKeyDown, scale, setScale]);

  return { scale, setScale, resetScale, toggleFullscreen };
}
