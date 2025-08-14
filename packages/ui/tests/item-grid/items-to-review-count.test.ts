import { describe, it, expect } from "vitest";
import { getItemsToReviewCount } from "../../src/item-grid/built-in-columns";

describe("getItemsToReviewCount", () => {
  it("returns 0 when no field_metadata", () => {
    const item = { data: {}, status: "completed" } as unknown as any;
    expect(getItemsToReviewCount(item)).toBe(0);
  });

  it("counts only leaf confidence values below threshold", () => {
    const item = {
      field_metadata: {
        a: { confidence: 0.85 }, // leaf, low
        b: { confidence: 0.95 }, // leaf, high
        c: {
          // not leaf due to nested object
          confidence: 0.2,
          nested: { x: 1 },
        },
        d: {
          // nested structure with a leaf
          inner: { confidence: 0.1 },
        },
        e: [
          { confidence: 0.5 }, // leaf in array, low
          { confidence: 0.99 }, // leaf in array, high
        ],
      },
    } as unknown as any;

    expect(getItemsToReviewCount(item)).toBe(3);
  });
});


