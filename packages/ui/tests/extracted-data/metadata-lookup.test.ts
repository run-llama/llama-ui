import { describe, it, expect } from "vitest";
import {
  findExtractedFieldMetadata,
  isExtractedFieldMetadata,
  buildMetadataPaths,
  type ExtractedFieldMetadata,
} from "../../src/extracted-data/metadata-lookup";

describe("metadata-lookup", () => {
  const sampleMetadata: ExtractedFieldMetadata = {
    confidence: 0.95,
    reasoning: "Test reasoning",
    citation: [
      {
        page_number: 1,
        matching_text: "Test text",
      },
    ],
  };

  describe("findExtractedFieldMetadata", () => {
    it("should find metadata with direct path lookup", () => {
      const metadata = {
        "merchant.name": sampleMetadata,
      };

      const result = findExtractedFieldMetadata("merchant.name", metadata);
      expect(result).toEqual(sampleMetadata);
    });

    it("should find metadata with array path", () => {
      const metadata = {
        "merchant.name": sampleMetadata,
      };

      const result = findExtractedFieldMetadata(["merchant", "name"], metadata);
      expect(result).toEqual(sampleMetadata);
    });

    it("should find metadata with array indices", () => {
      const metadata = {
        "items.0.description": sampleMetadata,
      };

      const result = findExtractedFieldMetadata("items.0.description", metadata);
      expect(result).toEqual(sampleMetadata);
    });

    it("should find nested metadata", () => {
      const metadata = {
        merchant: {
          name: sampleMetadata,
        },
      };

      const result = findExtractedFieldMetadata("merchant.name", metadata);
      expect(result).toEqual(sampleMetadata);
    });

    it("should return undefined for non-existent path", () => {
      const metadata = {
        "merchant.name": sampleMetadata,
      };

      const result = findExtractedFieldMetadata("merchant.address", metadata);
      expect(result).toBeUndefined();
    });

    it("should handle mixed nested and flattened structure", () => {
      const metadata = {
        "items.0.price": sampleMetadata,
        merchant: {
          address: {
            street: { ...sampleMetadata, confidence: 0.88 },
          },
        },
      };

      // Test flattened lookup
      const result1 = findExtractedFieldMetadata("items.0.price", metadata);
      expect(result1).toEqual(sampleMetadata);

      // Test nested lookup
      const result2 = findExtractedFieldMetadata("merchant.address.street", metadata);
      expect(result2?.confidence).toBe(0.88);
    });

    it("should handle invalid metadata gracefully", () => {
      const metadata = {
        "merchant.name": { invalid: "data" },
        "items.0": "not an object",
      };

      const result1 = findExtractedFieldMetadata("merchant.name", metadata);
      expect(result1).toBeUndefined();

      const result2 = findExtractedFieldMetadata("items.0", metadata);
      expect(result2).toBeUndefined();
    });
  });

  describe("isExtractedFieldMetadata", () => {
    it("should return true for valid metadata", () => {
      expect(isExtractedFieldMetadata(sampleMetadata)).toBe(true);
    });

    it("should return false for invalid metadata", () => {
      expect(isExtractedFieldMetadata(null)).toBe(false);
      expect(isExtractedFieldMetadata(undefined)).toBe(false);
      expect(isExtractedFieldMetadata("string")).toBe(false);
      expect(isExtractedFieldMetadata(123)).toBe(false);
      expect(isExtractedFieldMetadata({})).toBe(false);
      expect(isExtractedFieldMetadata({ confidence: 0.95 })).toBe(false);
      expect(
        isExtractedFieldMetadata({
          confidence: "0.95", // Wrong type
          reasoning: "Test",
          citation: [],
        })
      ).toBe(false);
    });

    it("should validate all required fields", () => {
      const partialMetadata = {
        confidence: 0.95,
        reasoning: "Test",
        // Missing citation
      };
      expect(isExtractedFieldMetadata(partialMetadata)).toBe(false);

      const invalidCitation = {
        confidence: 0.95,
        reasoning: "Test",
        citation: "not an array",
      };
      expect(isExtractedFieldMetadata(invalidCitation)).toBe(false);
    });
  });

  describe("buildMetadataPaths", () => {
    it("should build paths for simple object", () => {
      const data = {
        name: "John",
        age: 30,
      };

      const paths = buildMetadataPaths(data);
      expect(paths).toContain("name");
      expect(paths).toContain("age");
      expect(paths).toHaveLength(2);
    });

    it("should build paths for nested object", () => {
      const data = {
        merchant: {
          name: "ACME Corp",
          address: {
            street: "123 Main St",
            city: "New York",
          },
        },
      };

      const paths = buildMetadataPaths(data);
      expect(paths).toContain("merchant");
      expect(paths).toContain("merchant.name");
      expect(paths).toContain("merchant.address");
      expect(paths).toContain("merchant.address.street");
      expect(paths).toContain("merchant.address.city");
    });

    it("should build paths for arrays", () => {
      const data = {
        items: [
          { name: "Item 1", price: 100 },
          { name: "Item 2", price: 200 },
        ],
      };

      const paths = buildMetadataPaths(data);
      expect(paths).toContain("items");
      expect(paths).toContain("items.0");
      expect(paths).toContain("items.0.name");
      expect(paths).toContain("items.0.price");
      expect(paths).toContain("items.1");
      expect(paths).toContain("items.1.name");
      expect(paths).toContain("items.1.price");
    });

    it("should handle empty data", () => {
      expect(buildMetadataPaths(null)).toEqual([]);
      expect(buildMetadataPaths(undefined)).toEqual([]);
      expect(buildMetadataPaths("string")).toEqual([]);
      expect(buildMetadataPaths(123)).toEqual([]);
    });

    it("should handle empty objects and arrays", () => {
      expect(buildMetadataPaths({})).toEqual([]);
      expect(buildMetadataPaths([])).toEqual([]);
    });

    it("should work with prefix", () => {
      const data = { name: "John" };
      const paths = buildMetadataPaths(data, "user");
      expect(paths).toContain("user.name");
    });
  });
});
