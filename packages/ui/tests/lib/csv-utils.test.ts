import { describe, it, expect } from "vitest";
import { arrayToCsv } from "../../src/lib/csv-utils";

describe("arrayToCsv", () => {
  it("should convert simple array of numbers to CSV", () => {
    expect(arrayToCsv([1, 2, 3])).toBe("1, 2, 3");
    expect(arrayToCsv([10, 20, 30])).toBe("10, 20, 30");
  });

  it("should convert array of strings to CSV", () => {
    expect(arrayToCsv(["hello", "world"])).toBe("hello, world");
    expect(arrayToCsv(["a", "b", "c"])).toBe("a, b, c");
  });

  it("should convert mixed type arrays to CSV", () => {
    expect(arrayToCsv([1, "two", 3])).toBe("1, two, 3");
    expect(arrayToCsv(["hello", 42, true])).toBe("hello, 42, true");
  });

  it("should handle empty arrays", () => {
    expect(arrayToCsv([])).toBe("");
  });

  it("should handle null and undefined values", () => {
    expect(arrayToCsv([null, undefined, ""])).toBe(", , ");
    expect(arrayToCsv([1, null, 3])).toBe("1, , 3");
    expect(arrayToCsv([undefined, "test"])).toBe(", test");
  });

  it("should quote values containing commas", () => {
    expect(arrayToCsv(["a,b", "c"])).toBe('"a,b", c');
    expect(arrayToCsv(["hello, world", "test"])).toBe('"hello, world", test');
    expect(arrayToCsv(["a", "b,c", "d"])).toBe('a, "b,c", d');
  });

  it("should quote values containing quotes", () => {
    expect(arrayToCsv(['say "hello"', "world"])).toBe('"say ""hello""", world');
    expect(arrayToCsv(['a"b', "c"])).toBe('"a""b", c');
  });

  it("should escape quotes by doubling them", () => {
    expect(arrayToCsv(['say "hello"'])).toBe('"say ""hello"""');
    expect(arrayToCsv(['a"b"c'])).toBe('"a""b""c"');
  });

  it("should quote values containing newlines", () => {
    expect(arrayToCsv(["line1\nline2", "test"])).toBe('"line1\nline2", test');
    expect(arrayToCsv(["a", "b\nc", "d"])).toBe('a, "b\nc", d');
  });

  it("should quote values containing multiple special characters", () => {
    expect(arrayToCsv(['say "hello, world"\nnext line', "test"])).toBe(
      '"say ""hello, world""\nnext line", test'
    );
  });

  it("should handle boolean values", () => {
    expect(arrayToCsv([true, false])).toBe("true, false");
  });

  it("should handle single element arrays", () => {
    expect(arrayToCsv([1])).toBe("1");
    expect(arrayToCsv(["hello"])).toBe("hello");
    expect(arrayToCsv(['say "hello"'])).toBe('"say ""hello"""');
  });

  it("should handle arrays with only null/undefined", () => {
    expect(arrayToCsv([null])).toBe("");
    expect(arrayToCsv([undefined])).toBe("");
    expect(arrayToCsv([null, null])).toBe(", ");
  });

  it("should handle numeric zero and empty string", () => {
    expect(arrayToCsv([0, ""])).toBe("0, ");
    expect(arrayToCsv(["", 0])).toBe(", 0");
  });
});
