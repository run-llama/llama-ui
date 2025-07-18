import { describe, expect, it } from "vitest";
import { flattenConfidence } from "@/src/extracted-data/confidence-utils";

describe("Confidence Flattening", () => {
  describe("flattenConfidence", () => {
    it("should handle primitive values", () => {
      const nested = {
        receiptNumber: 0.95,
        invoiceNumber: 0.87,
      };

      const result = flattenConfidence(nested);

      expect(result).toEqual({
        receiptNumber: 0.95,
        invoiceNumber: 0.87,
      });
    });

    it("should handle nested objects", () => {
      const nested = {
        merchant: {
          name: 0.92,
          address: {
            street: 0.78,
            city: 0.89,
          },
        },
      };

      const result = flattenConfidence(nested);

      expect(result).toEqual({
        "merchant.name": 0.92,
        "merchant.address.street": 0.78,
        "merchant.address.city": 0.89,
      });
    });

    it("should handle arrays of primitives", () => {
      const nested = {
        tags: [0.96, 0.85, 0.92],
      };

      const result = flattenConfidence(nested);

      expect(result).toEqual({
        "tags.0": 0.96,
        "tags.1": 0.85,
        "tags.2": 0.92,
      });
    });

    it("should handle arrays of objects", () => {
      const nested = {
        items: [
          { description: 0.94, amount: 0.88 },
          { description: 0.91, amount: 0.85 },
        ],
      };

      const result = flattenConfidence(nested);

      expect(result).toEqual({
        "items.0.description": 0.94,
        "items.0.amount": 0.88,
        "items.1.description": 0.91,
        "items.1.amount": 0.85,
      });
    });

    it("should handle complex nested structures", () => {
      const nested = {
        receiptNumber: 0.95,
        merchant: {
          name: 0.92,
          address: {
            street: 0.78,
            city: 0.89,
          },
        },
        items: [
          {
            description: 0.94,
            period: {
              start: 0.88,
              end: 0.91,
            },
          },
          {
            description: 0.87,
            period: {
              start: 0.83,
              end: 0.86,
            },
          },
        ],
        tags: [0.96, 0.85],
      };

      const result = flattenConfidence(nested);

      expect(result).toEqual({
        receiptNumber: 0.95,
        "merchant.name": 0.92,
        "merchant.address.street": 0.78,
        "merchant.address.city": 0.89,
        "items.0.description": 0.94,
        "items.0.period.start": 0.88,
        "items.0.period.end": 0.91,
        "items.1.description": 0.87,
        "items.1.period.start": 0.83,
        "items.1.period.end": 0.86,
        "tags.0": 0.96,
        "tags.1": 0.85,
      });
    });

    it("should handle empty objects", () => {
      const result = flattenConfidence({});
      expect(result).toEqual({});
    });

    it("should handle null and undefined values gracefully", () => {
      const nested = {
        valid: 0.95,
        nullValue: null,
        undefinedValue: undefined,
      };

      const result = flattenConfidence(nested);

      expect(result).toEqual({
        valid: 0.95,
      });
    });

    it("should handle mixed array types", () => {
      const nested = {
        mixed: [0.5, { nested: 0.8 }, 0.7],
      };

      const result = flattenConfidence(nested);

      expect(result).toEqual({
        "mixed.0": 0.5,
        "mixed.1.nested": 0.8,
        "mixed.2": 0.7,
      });
    });
  });
});
