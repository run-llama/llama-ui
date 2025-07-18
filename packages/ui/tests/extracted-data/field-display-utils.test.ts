import { describe, it, expect } from "vitest";
import { getFieldDisplayInfo } from "@/src/extracted-data/field-display-utils";
import type { FieldMetadata } from "@/src/extracted-data/schema-reconciliation";

describe("field-display-utils path construction", () => {
  const mockFieldMetadata: Record<string, FieldMetadata> = {
    // Simple field
    receiptNumber: {
      isRequired: true,
      isOptional: false,
      wasMissing: false,
      schemaType: "string",
      title: "Receipt Number",
    },
    // Nested object field
    "merchant.name": {
      isRequired: true,
      isOptional: false,
      wasMissing: false,
      schemaType: "string",
      title: "Merchant Name",
    },
    // Array item field - table scenario
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
  };

  it("should find metadata for simple fields", () => {
    const result = getFieldDisplayInfo(
      "receiptNumber",
      mockFieldMetadata,
      [],
      ["receiptNumber"],
    );
    expect(result.name).toBe("Receipt Number");
    expect(result.isRequired).toBe(true);
  });

  it("should find metadata for nested object fields", () => {
    const result = getFieldDisplayInfo(
      "name",
      mockFieldMetadata,
      [],
      ["merchant", "name"],
    );
    expect(result.name).toBe("Merchant Name");
    expect(result.isRequired).toBe(true);
  });

  it("should find metadata for array item fields (table scenario)", () => {
    // Test description field in table
    const descResult = getFieldDisplayInfo(
      "description",
      mockFieldMetadata,
      [],
      ["items", "0", "description"],
    );
    expect(descResult.name).toBe("Description");
    expect(descResult.isRequired).toBe(true);

    // Test nested period.start field in table
    const startResult = getFieldDisplayInfo(
      "start",
      mockFieldMetadata,
      [],
      ["items", "0", "period", "start"],
    );
    expect(startResult.name).toBe("Start Date");
    expect(startResult.isRequired).toBe(true);

    // Test nested period.end field in table
    const endResult = getFieldDisplayInfo(
      "end",
      mockFieldMetadata,
      [],
      ["items", "0", "period", "end"],
    );
    expect(endResult.name).toBe("End Date");
    expect(endResult.isRequired).toBe(true);
  });

  it("should fallback to formatted field name when metadata not found", () => {
    const result = getFieldDisplayInfo(
      "unknownField",
      mockFieldMetadata,
      [],
      ["unknownField"],
    );
    expect(result.name).toBe("UnknownField"); // formatFieldName result for camelCase
    expect(result.isRequired).toBe(false);
  });

  it("should construct path string correctly", () => {
    // Test that path construction matches metadata keys
    const testCases = [
      { keyPath: ["receiptNumber"], expectedPath: "receiptNumber" },
      { keyPath: ["merchant", "name"], expectedPath: "merchant.name" },
      {
        keyPath: ["items", "0", "description"],
        expectedPath: "items.0.description",
      },
      {
        keyPath: ["items", "0", "period", "start"],
        expectedPath: "items.0.period.start",
      },
    ];

    testCases.forEach(({ keyPath, expectedPath }) => {
      // We can verify this by checking that the metadata is found
      const lastKey = keyPath[keyPath.length - 1];
      const result = getFieldDisplayInfo(
        lastKey,
        mockFieldMetadata,
        [],
        keyPath,
      );

      // If the path construction is correct, we should find the metadata
      if (mockFieldMetadata[expectedPath]) {
        expect(result.name).toBe(mockFieldMetadata[expectedPath].title);
      }
    });
  });
});
