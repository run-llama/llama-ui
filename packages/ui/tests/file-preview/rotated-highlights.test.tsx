import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImagePreview } from "@/src/document-preview/previews/image-preview";
import { BoundingBoxOverlay } from "@/src/file-preview/bounding-box-overlay";
import { groupHighlightsByPage } from "@/src/file-preview/pdf-preview-utils";

// Exercise the same highlight conversion and SVG overlay used by PDF previews.
describe("rotated highlights", () => {
  it.each([30, -30, 90, -90, 180, 0, 360, undefined])(
    "renders rotation %s once, around the literal rectangle's center",
    (rotation) => {
      const boxes = groupHighlightsByPage([
        { page: 1, x: 20, y: 40, width: 120, height: 10, rotation },
      ])[1];
      const onClick = vi.fn();
      const { container } = render(
        <BoundingBoxOverlay
          boundingBoxes={boxes}
          zoom={2}
          containerWidth={600}
          containerHeight={800}
          onBoundingBoxClick={onClick}
        />
      );
      const rect = container.querySelector("rect")!;
      expect(container.querySelectorAll("rect")).toHaveLength(1);
      expect(rect.getAttribute("x")).toBe("20");
      expect(rect.getAttribute("width")).toBe("120");
      expect(rect.parentElement?.getAttribute("transform")).toBe(
        rotation && rotation % 360 ? `rotate(${rotation} 80 45)` : null
      );
      fireEvent.click(rect);
      expect(onClick).toHaveBeenCalledWith(boxes[0]);
    }
  );
});

it("preserves rotation through image preview highlight conversion", () => {
  const { container } = render(
    <ImagePreview
      contentUrl="/page.png"
      highlights={[
        { page: 1, x: 20, y: 40, width: 120, height: 10, rotation: -30 },
      ]}
    />
  );
  const image = container.querySelector("img")!;
  Object.defineProperties(image, {
    naturalWidth: { value: 600 },
    naturalHeight: { value: 800 },
  });
  fireEvent.load(image);
  expect(
    container.querySelector("rect")?.parentElement?.getAttribute("transform")
  ).toBe("rotate(-30 80 45)");
});
