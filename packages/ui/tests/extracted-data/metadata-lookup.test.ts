import { describe, it, expect } from "vitest";
import { findExtractedFieldMetadata } from "../../src/extracted-data/metadata-lookup";
import type { ExtractedFieldMetadataDict } from "@/src/lib/agent-data";

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

  describe("metadata cascading", () => {
    it("should cascade parent metadata to child when child has no metadata", () => {
      const metadataWithParent: ExtractedFieldMetadataDict = {
        contact_info: {
          confidence: 0.9,
          reasoning: "Contact information extracted from header",
          citation: [{ page_number: 1, matching_text: "Contact section" }],
          email: {
            // Child has no metadata, should inherit from parent
          },
        },
      };

      const result = findExtractedFieldMetadata(
        "contact_info.email",
        metadataWithParent
      );
      expect(result).toBeDefined();
      expect(result?.confidence).toBe(0.9);
      expect(result?.reasoning).toBe(
        "Contact information extracted from header"
      );
      expect(result?.citation).toEqual([
        { page_number: 1, matching_text: "Contact section" },
      ]);
    });

    it("should merge parent and child metadata with child taking precedence", () => {
      const metadataWithBoth: ExtractedFieldMetadataDict = {
        contact_info: {
          confidence: 0.9,
          reasoning: "Contact information extracted from header",
          citation: [{ page_number: 1, matching_text: "Contact section" }],
          email: {
            confidence: 0.95,
            citation: [
              { page_number: 1, matching_text: "ypark@protonmail.com" },
            ],
            // Child doesn't have reasoning, should inherit from parent
          },
        },
      };

      const result = findExtractedFieldMetadata(
        "contact_info.email",
        metadataWithBoth
      );
      expect(result).toBeDefined();
      // Child confidence takes precedence
      expect(result?.confidence).toBe(0.95);
      // Parent reasoning cascades down
      expect(result?.reasoning).toBe(
        "Contact information extracted from header"
      );
      // Child citation takes precedence
      expect(result?.citation).toEqual([
        { page_number: 1, matching_text: "ypark@protonmail.com" },
      ]);
    });

    it("should cascade through multiple levels", () => {
      const multiLevelMetadata: ExtractedFieldMetadataDict = {
        contact_info: {
          confidence: 0.85,
          reasoning: "Top level reasoning",
          address: {
            confidence: 0.88,
            reasoning: "Address level reasoning",
            street: {
              // No metadata at leaf, should inherit from both parent and grandparent
            },
          },
        },
      };

      const result = findExtractedFieldMetadata(
        "contact_info.address.street",
        multiLevelMetadata
      );
      expect(result).toBeDefined();
      // Should get the most recent parent (address level)
      expect(result?.confidence).toBe(0.88);
      expect(result?.reasoning).toBe("Address level reasoning");
    });

    it("should work with citation-only metadata (no confidence)", () => {
      const citationOnlyMetadata: ExtractedFieldMetadataDict = {
        contact_info: {
          citation: [{ page_number: 1, matching_text: "Contact section" }],
          email: {
            citation: [{ page_number: 1, matching_text: "test@example.com" }],
          },
        },
      };

      const result = findExtractedFieldMetadata(
        "contact_info.email",
        citationOnlyMetadata
      );
      expect(result).toBeDefined();
      expect(result?.citation).toEqual([
        { page_number: 1, matching_text: "test@example.com" },
      ]);
    });

    it("should cascade parent metadata through array items", () => {
      const arrayMetadata: ExtractedFieldMetadataDict = {
        section: {
          confidence: 0.85,
          reasoning: "Section metadata",
          items: [
            {
              description: {
                // No metadata, should inherit from parent section
              },
            },
          ],
        },
      };

      // This tests that parent metadata cascades through arrays to children
      const result = findExtractedFieldMetadata(
        "section.items.0.description",
        arrayMetadata
      );
      // Should return parent metadata since child has none
      expect(result).toBeDefined();
      expect(result?.confidence).toBe(0.85);
      expect(result?.reasoning).toBe("Section metadata");
    });

    it("should handle parent with metadata but child is not an object", () => {
      const metadataWithPrimitive: ExtractedFieldMetadataDict = {
        contact_info: {
          confidence: 0.9,
          reasoning: "Contact info",
          email: "test@example.com", // Child is a primitive, not an object
        },
      };

      const result = findExtractedFieldMetadata(
        "contact_info.email",
        metadataWithPrimitive
      );
      // Should return parent metadata since child is not an object with metadata
      expect(result).toBeDefined();
      expect(result?.confidence).toBe(0.9);
      expect(result?.reasoning).toBe("Contact info");
    });

    it("should not cascade when child has all fields (complete override)", () => {
      const completeOverride: ExtractedFieldMetadataDict = {
        contact_info: {
          confidence: 0.8,
          reasoning: "Parent reasoning",
          citation: [{ page_number: 1, matching_text: "Parent citation" }],
          email: {
            confidence: 0.95,
            reasoning: "Child reasoning",
            citation: [{ page_number: 1, matching_text: "Child citation" }],
          },
        },
      };

      const result = findExtractedFieldMetadata(
        "contact_info.email",
        completeOverride
      );
      expect(result).toBeDefined();
      // Child should completely override parent
      expect(result?.confidence).toBe(0.95);
      expect(result?.reasoning).toBe("Child reasoning");
      expect(result?.citation).toEqual([
        { page_number: 1, matching_text: "Child citation" },
      ]);
    });

    it("should handle deeply nested cascading", () => {
      const deepNested: ExtractedFieldMetadataDict = {
        level1: {
          confidence: 0.7,
          reasoning: "Level 1 reasoning",
          level2: {
            confidence: 0.8,
            reasoning: "Level 2 reasoning",
            level3: {
              confidence: 0.9,
              level4: {
                // No metadata, should inherit from level3
              },
            },
          },
        },
      };

      const result = findExtractedFieldMetadata(
        "level1.level2.level3.level4",
        deepNested
      );
      expect(result).toBeDefined();
      expect(result?.confidence).toBe(0.9);
      expect(result?.reasoning).toBe("Level 2 reasoning");
    });
  });
});
