"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.25;

interface PreviewControlsOptions {
  /** Extra key handlers (e.g. ArrowLeft/ArrowRight for page navigation). */
  onKeyDown?: (event: KeyboardEvent) => void;
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
  const [scale, setScale] = useState(1);

  const resetScale = useCallback(() => setScale(1), []);

  const toggleFullscreen = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen?.();
    }
  }, [containerRef]);

  const { onKeyDown: onExtraKeyDown } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        setScale((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX));
      } else if (event.key === "-") {
        event.preventDefault();
        setScale((prev) => Math.max(prev - ZOOM_STEP, ZOOM_MIN));
      } else {
        onExtraKeyDown?.(event);
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.tabIndex = 0;

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, onExtraKeyDown]);

  return { scale, setScale, resetScale, toggleFullscreen };
}
