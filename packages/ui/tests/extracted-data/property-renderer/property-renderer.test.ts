import { describe, expect, it } from "vitest";
import {
  formatFieldName,
  isPropertyChanged,
  isArrayOfObjects,
  shouldShowKeyOnSeparateLine,
} from "@/src/extracted-data/property-renderer/property-renderer-utils";

describe("PropertyRenderer Utilities", () => {
  describe("formatFieldName", () => {
    it("should format simple field names", () => {
      expect(formatFieldName("name")).toBe("Name");
      expect(formatFieldName("age")).toBe("Age");
    });

    it("should format field names with underscores", () => {
      expect(formatFieldName("first_name")).toBe("First Name");
      expect(formatFieldName("user_id")).toBe("User Id");
    });

    it("should handle camelCase", () => {
      expect(formatFieldName("firstName")).toBe("FirstName");
      expect(formatFieldName("userId")).toBe("UserId");
    });
  });

  describe("isPropertyChanged", () => {
    it("should return false when changedPaths is undefined", () => {
      const result = isPropertyChanged(undefined, ["user", "name"]);
      expect(result).toBe(false);
    });

    it("should return false when changedPaths is empty", () => {
      const result = isPropertyChanged(new Set(), ["user", "name"]);
      expect(result).toBe(false);
    });

    it("should return true when property is changed", () => {
      const changedPaths = new Set(["user.name", "user.age"]);
      const result = isPropertyChanged(changedPaths, ["user", "name"]);
      expect(result).toBe(true);
    });

    it("should return false when property is not changed", () => {
      const changedPaths = new Set(["user.name", "user.age"]);
      const result = isPropertyChanged(changedPaths, ["user", "email"]);
      expect(result).toBe(false);
    });

    it("should work with nested paths", () => {
      const changedPaths = new Set(["user.contact.email"]);
      const result = isPropertyChanged(changedPaths, [
        "user",
        "contact",
        "email",
      ]);
      expect(result).toBe(true);
    });

    it("should work with single-level paths", () => {
      const changedPaths = new Set(["name", "age"]);
      const result = isPropertyChanged(changedPaths, ["name"]);
      expect(result).toBe(true);
    });
  });

  describe("isArrayOfObjects", () => {
    it("should return false for empty array", () => {
      const result = isArrayOfObjects([]);
      expect(result).toBe(false);
    });

    it("should return false for array of primitives", () => {
      expect(isArrayOfObjects([1, 2, 3])).toBe(false);
      expect(isArrayOfObjects(["a", "b", "c"])).toBe(false);
      expect(isArrayOfObjects([true, false])).toBe(false);
    });

    it("should return false for array of nulls", () => {
      const result = isArrayOfObjects([null, null]);
      expect(result).toBe(false);
    });

    it("should return false for array of arrays", () => {
      const result = isArrayOfObjects([
        [1, 2],
        [3, 4],
      ]);
      expect(result).toBe(false);
    });

    it("should return true for array of objects", () => {
      const result = isArrayOfObjects([{ id: 1 }, { id: 2 }]);
      expect(result).toBe(true);
    });

    it("should return true for array with mixed object types", () => {
      const result = isArrayOfObjects([{ name: "John" }, { age: 30 }]);
      expect(result).toBe(true);
    });
  });

  describe("shouldShowKeyOnSeparateLine", () => {
    it("should return false for primitive values", () => {
      expect(shouldShowKeyOnSeparateLine("string")).toBe(false);
      expect(shouldShowKeyOnSeparateLine(123)).toBe(false);
      expect(shouldShowKeyOnSeparateLine(true)).toBe(false);
      expect(shouldShowKeyOnSeparateLine(null)).toBe(false);
      expect(shouldShowKeyOnSeparateLine(undefined)).toBe(false);
    });

    it("should return false for array of primitives", () => {
      expect(shouldShowKeyOnSeparateLine([1, 2, 3])).toBe(false);
      expect(shouldShowKeyOnSeparateLine(["a", "b"])).toBe(false);
      expect(shouldShowKeyOnSeparateLine([])).toBe(false);
    });

    it("should return true for array of objects", () => {
      const result = shouldShowKeyOnSeparateLine([{ id: 1 }, { id: 2 }]);
      expect(result).toBe(true);
    });

    it("should return true for objects", () => {
      expect(shouldShowKeyOnSeparateLine({ name: "John" })).toBe(true);
      expect(shouldShowKeyOnSeparateLine({})).toBe(true);
    });

    it("should return false for nested arrays", () => {
      const result = shouldShowKeyOnSeparateLine([
        [1, 2],
        [3, 4],
      ]);
      expect(result).toBe(false);
    });
  });
});
