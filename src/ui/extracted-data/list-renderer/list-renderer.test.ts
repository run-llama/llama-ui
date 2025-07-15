import { describe, expect, it } from "vitest";
import type { FieldMetadata } from "../schema-reconciliation";
import {
  buildArrayItemPath,
  isArrayItemChanged,
  getArrayItemDefaultValue,
} from "./list-renderer-utils";

describe("ListRenderer Utilities", () => {
  describe("buildArrayItemPath", () => {
    it("should build path for simple keyPath", () => {
      const result = buildArrayItemPath(["tags"], 0);
      expect(result).toBe("tags.0");
    });

    it("should build path for nested keyPath", () => {
      const result = buildArrayItemPath(["user", "preferences", "tags"], 2);
      expect(result).toBe("user.preferences.tags.2");
    });

    it("should build path for empty keyPath", () => {
      const result = buildArrayItemPath([], 5);
      expect(result).toBe("5");
    });

    it("should handle string index conversion", () => {
      const result = buildArrayItemPath(["items"], 10);
      expect(result).toBe("items.10");
    });
  });

  describe("isArrayItemChanged", () => {
    it("should return false when changedPaths is undefined", () => {
      const result = isArrayItemChanged(undefined, ["tags"], 0);
      expect(result).toBe(false);
    });

    it("should return false when changedPaths is empty", () => {
      const result = isArrayItemChanged(new Set(), ["tags"], 0);
      expect(result).toBe(false);
    });

    it("should return true when item is changed", () => {
      const changedPaths = new Set(["tags.0", "tags.2"]);
      const result = isArrayItemChanged(changedPaths, ["tags"], 0);
      expect(result).toBe(true);
    });

    it("should return false when item is not changed", () => {
      const changedPaths = new Set(["tags.0", "tags.2"]);
      const result = isArrayItemChanged(changedPaths, ["tags"], 1);
      expect(result).toBe(false);
    });

    it("should work with nested paths", () => {
      const changedPaths = new Set(["user.preferences.tags.1"]);
      const result = isArrayItemChanged(
        changedPaths,
        ["user", "preferences", "tags"],
        1,
      );
      expect(result).toBe(true);
    });

    it("should work with empty keyPath", () => {
      const changedPaths = new Set(["3"]);
      const result = isArrayItemChanged(changedPaths, [], 3);
      expect(result).toBe(true);
    });

    it("should handle multiple changed items", () => {
      const changedPaths = new Set(["items.0", "items.5", "items.10"]);

      expect(isArrayItemChanged(changedPaths, ["items"], 0)).toBe(true);
      expect(isArrayItemChanged(changedPaths, ["items"], 1)).toBe(false);
      expect(isArrayItemChanged(changedPaths, ["items"], 5)).toBe(true);
      expect(isArrayItemChanged(changedPaths, ["items"], 10)).toBe(true);
    });
  });

  describe("getArrayItemDefaultValue", () => {
    it("should return empty string when no metadata provided", () => {
      const result = getArrayItemDefaultValue(["tags"], {});
      expect(result).toBe("");
    });

    it("should return empty string when array metadata not found", () => {
      const fieldMetadata = {
        other: {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Other",
          wasMissing: false,
        },
      };

      const result = getArrayItemDefaultValue(["scores"], fieldMetadata);
      expect(result).toBe("");
    });

    it("should return 0 for number array items", () => {
      const fieldMetadata = {
        "scores.*": {
          isRequired: true,
          isOptional: false,
          schemaType: "number",
          title: "Score",
          wasMissing: false,
        },
      };

      const result = getArrayItemDefaultValue(["scores"], fieldMetadata);
      expect(result).toBe(0);
    });

    it("should return false for boolean array items", () => {
      const fieldMetadata = {
        "flags.*": {
          isRequired: true,
          isOptional: false,
          schemaType: "boolean",
          title: "Flag",
          wasMissing: false,
        },
      };

      const result = getArrayItemDefaultValue(["flags"], fieldMetadata);
      expect(result).toBe(false);
    });

    it("should return empty string for string array items", () => {
      const fieldMetadata = {
        "tags.*": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Tag",
          wasMissing: false,
        },
      };

      const result = getArrayItemDefaultValue(["tags"], fieldMetadata);
      expect(result).toBe("");
    });

    it("should work with nested keyPaths", () => {
      const fieldMetadata = {
        "user.preferences.tags.*": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Tag",
          wasMissing: false,
        },
      };

      const result = getArrayItemDefaultValue(
        ["user", "preferences", "tags"],
        fieldMetadata,
      );
      expect(result).toBe("");
    });

    it("should return empty string when schemaType is missing", () => {
      const fieldMetadata = {
        "data.*": {
          isRequired: true,
          isOptional: false,
          // schemaType is missing
          title: "Data Item",
          wasMissing: false,
        },
      } as unknown as Record<string, FieldMetadata>; // Type assertion to test malformed data case

      const result = getArrayItemDefaultValue(["data"], fieldMetadata);
      expect(result).toBe("");
    });

    it("should handle unknown schema types as strings", () => {
      const fieldMetadata = {
        "data.*": {
          isRequired: true,
          isOptional: false,
          schemaType: "unknown",
          title: "Data Item",
          wasMissing: false,
        },
      };

      const result = getArrayItemDefaultValue(["data"], fieldMetadata);
      expect(result).toBe("");
    });
  });
});
