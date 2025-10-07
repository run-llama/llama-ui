import { describe, expect, it } from "vitest";
import {
  PrimitiveType,
  toPrimitiveType,
  convertPrimitiveValue,
  getDefaultPrimitiveValue,
  inferTypeFromValue,
} from "@/src/extracted-data/primitive-validation";

describe("primitive-validation", () => {
  describe("toPrimitiveType", () => {
    it("should convert schema types to PrimitiveType enum", () => {
      expect(toPrimitiveType("string")).toBe(PrimitiveType.STRING);
      expect(toPrimitiveType("number")).toBe(PrimitiveType.NUMBER);
      expect(toPrimitiveType("boolean")).toBe(PrimitiveType.BOOLEAN);
    });

    it("should default to STRING for unknown types", () => {
      expect(toPrimitiveType("unknown")).toBe(PrimitiveType.STRING);
      expect(toPrimitiveType("object")).toBe(PrimitiveType.STRING);
      expect(toPrimitiveType("array")).toBe(PrimitiveType.STRING);
    });
  });

  describe("convertPrimitiveValue", () => {
    it("should convert string values correctly", () => {
      expect(convertPrimitiveValue("hello", PrimitiveType.STRING)).toBe("hello");
      expect(convertPrimitiveValue("", PrimitiveType.STRING)).toBe("");
    });

    it("should convert number values correctly", () => {
      expect(convertPrimitiveValue("42", PrimitiveType.NUMBER)).toBe(42);
      expect(convertPrimitiveValue("0", PrimitiveType.NUMBER)).toBe(0);
      expect(convertPrimitiveValue("-10.5", PrimitiveType.NUMBER)).toBe(-10.5);
    });

    it("should handle empty number inputs based on required flag", () => {
      expect(convertPrimitiveValue("", PrimitiveType.NUMBER, false)).toBe(null);
      expect(convertPrimitiveValue("", PrimitiveType.NUMBER, true)).toBe("");
    });

    it("should convert boolean values correctly", () => {
      expect(convertPrimitiveValue("true", PrimitiveType.BOOLEAN)).toBe(true);
      expect(convertPrimitiveValue("false", PrimitiveType.BOOLEAN)).toBe(false);
    });
  });

  describe("getDefaultPrimitiveValue", () => {
    it("should return empty string for optional fields", () => {
      expect(getDefaultPrimitiveValue(PrimitiveType.STRING, false)).toBe("");
      expect(getDefaultPrimitiveValue(PrimitiveType.NUMBER, false)).toBe("");
      expect(getDefaultPrimitiveValue(PrimitiveType.BOOLEAN, false)).toBe("");
    });

    it("should return appropriate defaults for required fields", () => {
      expect(getDefaultPrimitiveValue(PrimitiveType.STRING, true)).toBe("");
      expect(getDefaultPrimitiveValue(PrimitiveType.NUMBER, true)).toBe(0);
      expect(getDefaultPrimitiveValue(PrimitiveType.BOOLEAN, true)).toBe(false);
    });
  });

  describe("inferTypeFromValue", () => {
    it("should infer BOOLEAN type from boolean values", () => {
      expect(inferTypeFromValue(true)).toBe(PrimitiveType.BOOLEAN);
      expect(inferTypeFromValue(false)).toBe(PrimitiveType.BOOLEAN);
    });

    it("should infer NUMBER type from number values", () => {
      expect(inferTypeFromValue(0)).toBe(PrimitiveType.NUMBER);
      expect(inferTypeFromValue(42)).toBe(PrimitiveType.NUMBER);
      expect(inferTypeFromValue(-10.5)).toBe(PrimitiveType.NUMBER);
      expect(inferTypeFromValue(3.14159)).toBe(PrimitiveType.NUMBER);
    });

    it("should infer STRING type from string values", () => {
      expect(inferTypeFromValue("hello")).toBe(PrimitiveType.STRING);
      expect(inferTypeFromValue("")).toBe(PrimitiveType.STRING);
      expect(inferTypeFromValue("42")).toBe(PrimitiveType.STRING);
      expect(inferTypeFromValue("true")).toBe(PrimitiveType.STRING);
    });

    it("should default to STRING for null and undefined", () => {
      expect(inferTypeFromValue(null)).toBe(PrimitiveType.STRING);
      expect(inferTypeFromValue(undefined)).toBe(PrimitiveType.STRING);
    });

    it("should handle edge cases", () => {
      // NaN is a number type in JavaScript
      expect(inferTypeFromValue(NaN)).toBe(PrimitiveType.NUMBER);
      // Infinity is also a number
      expect(inferTypeFromValue(Infinity)).toBe(PrimitiveType.NUMBER);
      expect(inferTypeFromValue(-Infinity)).toBe(PrimitiveType.NUMBER);
    });
  });
});
