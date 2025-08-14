import { describe, it, expect } from "vitest";
import {
  buildTableHeaderMetadataPath,
  findFieldMetadata,
} from "@/src/extracted-data/metadata-path-utils";
import type { FieldMetadata } from "@/src/extracted-data/schema-reconciliation";

describe("metadata-path-utils", () => {
  describe("buildTableHeaderMetadataPath", () => {
    it("should build correct path for top-level table column", () => {
      const result = buildTableHeaderMetadataPath(
        ["items"],
        ["description"],
        0
      );
      expect(result).toEqual(["items", "0", "description"]);
    });

    it("should build correct path for nested table column", () => {
      const result = buildTableHeaderMetadataPath(
        ["items"],
        ["period", "start"],
        1
      );
      expect(result).toEqual(["items", "0", "period", "start"]);
    });

    it("should build correct path for deeply nested table column", () => {
      const result = buildTableHeaderMetadataPath(
        ["items"],
        ["customer", "contact", "email"],
        2
      );
      expect(result).toEqual(["items", "0", "customer", "contact", "email"]);
    });

    it("should handle different parent paths", () => {
      const result = buildTableHeaderMetadataPath(
        ["data", "users"],
        ["profile", "name"],
        1
      );
      expect(result).toEqual(["data", "users", "0", "profile", "name"]);
    });
  });

  describe("findFieldMetadata", () => {
    const mockFieldMetadata: Record<string, FieldMetadata> = {
      // Direct matches
      "items.0.description": {
        isRequired: true,
        isOptional: false,
        wasMissing: false,
        schemaType: "string",
        title: "Description",
      },
      "items.0.period.start": {
        isRequired: true,
        isOptional: false,
        wasMissing: false,
        schemaType: "string",
        title: "Start Date",
      },
      "items.0.period.end": {
        isRequired: true,
        isOptional: false,
        wasMissing: false,
        schemaType: "string",
        title: "End Date",
      },
      // Wildcard patterns
      "items.*.description": {
        isRequired: true,
        isOptional: false,
        wasMissing: false,
        schemaType: "string",
        title: "Description",
      },
      "items.*.period": {
        isRequired: false,
        isOptional: true,
        wasMissing: false,
        schemaType: "object",
        title: "Period Info",
      },
    };

    it("should find exact path match", () => {
      const result = findFieldMetadata(
        ["items", "0", "description"],
        mockFieldMetadata
      );
      expect(result).toBeDefined();
      expect(result?.title).toBe("Description");
      expect(result?.isRequired).toBe(true);
    });

    it("should find nested field with exact match", () => {
      const result = findFieldMetadata(
        ["items", "0", "period", "start"],
        mockFieldMetadata
      );
      expect(result).toBeDefined();
      expect(result?.title).toBe("Start Date");
    });

    it("should fallback to index 0 when path doesn't include index", () => {
      const result = findFieldMetadata(
        ["items", "description"],
        mockFieldMetadata
      );
      expect(result).toBeDefined();
      expect(result?.title).toBe("Description");
    });

    it("should fallback to general pattern when specific index not found", () => {
      const result = findFieldMetadata(
        ["items", "5", "period"], // Index 5 doesn't exist in metadata
        mockFieldMetadata
      );
      expect(result).toBeDefined();
      expect(result?.title).toBe("Period Info");
    });

    it("should return undefined when no metadata found", () => {
      const result = findFieldMetadata(
        ["items", "0", "unknownField"],
        mockFieldMetadata
      );
      expect(result).toBeUndefined();
    });

    it("should handle complex nested paths with fallbacks", () => {
      const complexMetadata = {
        "data.0.user.profile.name": {
          isRequired: true,
          isOptional: false,
          wasMissing: false,
          schemaType: "string",
          title: "User Name",
        },
        "data.*.user.profile.name": {
          isRequired: true,
          isOptional: false,
          wasMissing: false,
          schemaType: "string",
          title: "User Name",
        },
      };

      // Test direct match
      let result = findFieldMetadata(
        ["data", "0", "user", "profile", "name"],
        complexMetadata
      );
      expect(result?.title).toBe("User Name");

      // Test fallback to wildcard pattern
      result = findFieldMetadata(
        ["data", "2", "user", "profile", "name"],
        complexMetadata
      );
      expect(result?.title).toBe("User Name");
    });
  });

  describe("integration test", () => {
    it("should work together for table header scenario", () => {
      const mockMetadata: Record<string, FieldMetadata> = {
        "items.0.period.start": {
          isRequired: true,
          isOptional: false,
          wasMissing: false,
          schemaType: "string",
          title: "Start Date",
        },
        "items.0.period.end": {
          isRequired: true,
          isOptional: false,
          wasMissing: false,
          schemaType: "string",
          title: "End Date",
        },
      };

      // Simulate table header construction for "start" field at depth 1
      const keyPath = buildTableHeaderMetadataPath(
        ["items"],
        ["period", "start"],
        1
      );

      const metadata = findFieldMetadata(keyPath, mockMetadata);

      expect(keyPath).toEqual(["items", "0", "period", "start"]);
      expect(metadata).toBeDefined();
      expect(metadata?.title).toBe("Start Date");
      expect(metadata?.isRequired).toBe(true);
    });
  });
});
