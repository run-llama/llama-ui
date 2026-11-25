import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SpotlightOverlay } from "../../src/file-preview/spotlight-overlay";

const renderOverlay = () =>
  render(
    <SpotlightOverlay
      boundingBoxes={[{ id: "a", x: 100, y: 200, width: 300, height: 100 }]}
      zoom={1}
      pageDims={{ width: 600, height: 800 }}
    />
  );
const layer = (name: "veil" | "ring") =>
  document.querySelector<HTMLElement>(`[data-spotlight-${name}]`)!;

const stubMotion = (reduce: boolean) => {
  const animate = vi.fn();
  Element.prototype.animate = animate;
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion: reduce"),
  }));
  return animate;
};

afterEach(() => {
  vi.unstubAllGlobals();
  // jsdom has no Element.animate of its own.
  delete (Element.prototype as { animate?: unknown }).animate;
});

// react-pdf puts its text layer at z-index 2 and its annotation layer (links,
// form-field tints) at 3. Catches: those layers painting over the veil, or
// the veil dimming the ring.
it("stacks the veil above react-pdf's layers and the ring above the veil", () => {
  renderOverlay();
  const veil = Number(layer("veil").style.zIndex);
  const ring = Number(layer("ring").style.zIndex);
  expect(veil).toBeGreaterThan(3);
  expect(ring).toBeGreaterThan(veil);
});

// Catches: the overlay swallowing text selection, link clicks and the
// click-to-hide handler on the page underneath.
it("lets pointer events through to the page", () => {
  renderOverlay();
  expect(layer("veil").style.pointerEvents).toBe("none");
  expect(layer("ring").style.pointerEvents).toBe("none");
});

// Catches: the veil taking the theme background, which turns a white page
// dark grey in dark theme.
it("veils with a fixed colour, not a theme variable", () => {
  renderOverlay();
  const { background } = layer("veil").style;
  expect(background).not.toBe("");
  expect(background).not.toContain("var(");
});

it("fades in on mount", () => {
  const animate = stubMotion(false);
  renderOverlay();
  expect(animate).toHaveBeenCalled();
});

// Catches: the fade running for users who asked for reduced motion.
it("does not animate when the user prefers reduced motion", () => {
  const animate = stubMotion(true);
  renderOverlay();
  expect(animate).not.toHaveBeenCalled();
});
