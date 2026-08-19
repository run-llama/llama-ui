import { describe, expect, it } from "vitest";
import { paginate } from "@/src/extracted-data/data-pagination";

describe("paginate", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];

  it("keeps original indices on page 1", () => {
    expect(paginate({ items, currentPage: 1, perPage: 10 })).toEqual([
      { item: "a", index: 0 },
      { item: "b", index: 1 },
      { item: "c", index: 2 },
      { item: "d", index: 3 },
      { item: "e", index: 4 },
      { item: "f", index: 5 },
      { item: "g", index: 6 },
      { item: "h", index: 7 },
      { item: "i", index: 8 },
      { item: "j", index: 9 },
    ]);
  });

  it("keeps original indices on page 2+", () => {
    expect(paginate({ items, currentPage: 2, perPage: 10 })).toEqual([
      { item: "k", index: 10 },
      { item: "l", index: 11 },
    ]);
  });
});
