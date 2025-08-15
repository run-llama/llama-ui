import { describe, it, expect } from "vitest";
import { findExtractedFieldMetadata } from "../../src/extracted-data/metadata-lookup";
import type { ExtractedFieldMetadataDict } from "llama-cloud-services/beta/agent";

describe("findExtractedFieldMetadata", () => {
  // Mock API-style tree metadata structure (mirrors data structure)
  const apiMetadata: ExtractedFieldMetadataDict = {
    invoice_number: {
      confidence: 0.95,
      reasoning: "Invoice number clearly identified",
      citation: [{ page_number: 1, matching_text: "INV-001" }],
    },
    total_amount: {
      confidence: 0.92,
      reasoning: "Total amount found in summary",
      citation: [{ page_number: 1, matching_text: "$1,000.00" }],
    },
    vendor: {
      name: {
        confidence: 0.88,
        reasoning: "Vendor name extracted from header",
        citation: [{ page_number: 1, matching_text: "Test Vendor" }],
      },
      address: {
        street: {
          confidence: 0.85,
          reasoning: "Street address found",
          citation: [{ page_number: 1, matching_text: "123 Main St" }],
        },
      },
    },
    line_items: [
      {
        description: {
          confidence: 0.9,
          reasoning: "First item description",
          citation: [{ page_number: 1, matching_text: "Item 1" }],
        },
        amount: {
          confidence: 0.87,
          reasoning: "First item amount",
          citation: [{ page_number: 1, matching_text: "$100" }],
        },
      },
      {
        description: {
          confidence: 0.85,
          reasoning: "Second item description",
          citation: [{ page_number: 1, matching_text: "Item 2" }],
        },
        amount: {
          confidence: 0.92,
          reasoning: "Second item amount",
          citation: [{ page_number: 1, matching_text: "$200" }],
        },
      },
    ],
  };

  it("should find metadata for simple field names", () => {
    const result = findExtractedFieldMetadata("invoice_number", apiMetadata);
    expect(result).toBeDefined();
    expect(result?.confidence).toBe(0.95);
    expect(result?.reasoning).toBe("Invoice number clearly identified");
  });

  it("should find metadata for nested object fields", () => {
    // "vendor.name" should find metadata at vendor.name path
    const result = findExtractedFieldMetadata("vendor.name", apiMetadata);
    expect(result).toBeDefined();
    expect(result?.confidence).toBe(0.88);
    expect(result?.reasoning).toBe("Vendor name extracted from header");
  });

  it("should find metadata for deeply nested object fields", () => {
    // "vendor.address.street" should find metadata at vendor.address.street path
    const result = findExtractedFieldMetadata(
      "vendor.address.street",
      apiMetadata
    );
    expect(result).toBeDefined();
    expect(result?.confidence).toBe(0.85);
    expect(result?.reasoning).toBe("Street address found");
  });

  it("should find metadata for array item fields", () => {
    // "line_items.0.description" should find metadata at line_items[0].description
    const result = findExtractedFieldMetadata(
      "line_items.0.description",
      apiMetadata
    );
    expect(result).toBeDefined();
    expect(result?.confidence).toBe(0.9);
    expect(result?.reasoning).toBe("First item description");

    // Test second array item
    const result2 = findExtractedFieldMetadata(
      "line_items.1.amount",
      apiMetadata
    );
    expect(result2).toBeDefined();
    expect(result2?.confidence).toBe(0.92);
    expect(result2?.reasoning).toBe("Second item amount");
  });

  it("should return undefined for non-existent fields", () => {
    const result = findExtractedFieldMetadata(
      "non_existent_field",
      apiMetadata
    );
    expect(result).toBeUndefined();
  });

  it("should handle empty metadata", () => {
    const result = findExtractedFieldMetadata("any_field", {});
    expect(result).toBeUndefined();
  });

  it("should work with array notation", () => {
    // Test with array path notation
    const result = findExtractedFieldMetadata(["vendor", "name"], apiMetadata);
    expect(result).toBeDefined();
    expect(result?.confidence).toBe(0.88);

    // Test with array item
    const result2 = findExtractedFieldMetadata(
      ["line_items", "0", "description"],
      apiMetadata
    );
    expect(result2).toBeDefined();
    expect(result2?.confidence).toBe(0.9);
  });

  it("should return undefined for non-existent nested paths", () => {
    const result = findExtractedFieldMetadata(
      "vendor.non_existent",
      apiMetadata
    );
    expect(result).toBeUndefined();

    // Test non-existent array index
    const result2 = findExtractedFieldMetadata(
      "line_items.5.description",
      apiMetadata
    );
    expect(result2).toBeUndefined();
  });
});
