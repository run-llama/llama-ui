import { describe, expect, it } from "vitest";
import {
  PrimitiveType,
  toPrimitiveType,
  convertPrimitiveValue,
  getDefaultPrimitiveValue,
  detectPrimitiveType,
} from "@/src/extracted-data/primitive-validation";

describe("Primitive Validation", () => {
  describe("toPrimitiveType", () => {
    it("should convert string schema types to PrimitiveType enum", () => {
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
    describe("STRING type", () => {
      it("should return the input value as is", () => {
        expect(convertPrimitiveValue("hello", PrimitiveType.STRING)).toBe(
          "hello"
        );
        expect(convertPrimitiveValue("", PrimitiveType.STRING)).toBe("");
      });
    });

    describe("NUMBER type", () => {
      it("should convert valid number strings to numbers", () => {
        expect(convertPrimitiveValue("42", PrimitiveType.NUMBER)).toBe(42);
        expect(convertPrimitiveValue("3.14", PrimitiveType.NUMBER)).toBe(3.14);
        expect(convertPrimitiveValue("-10", PrimitiveType.NUMBER)).toBe(-10);
      });

      it("should return null for empty string when not required", () => {
        expect(convertPrimitiveValue("", PrimitiveType.NUMBER, false)).toBe(
          null
        );
      });

      it("should return empty string for empty string when required", () => {
        expect(convertPrimitiveValue("", PrimitiveType.NUMBER, true)).toBe("");
      });
    });

    describe("BOOLEAN type", () => {
      it("should convert 'true' string to boolean true", () => {
        expect(convertPrimitiveValue("true", PrimitiveType.BOOLEAN)).toBe(
          true
        );
      });

      it("should convert 'false' string to boolean false", () => {
        expect(convertPrimitiveValue("false", PrimitiveType.BOOLEAN)).toBe(
          false
        );
      });

      it("should convert any other string to boolean false", () => {
        expect(convertPrimitiveValue("", PrimitiveType.BOOLEAN)).toBe(false);
        expect(convertPrimitiveValue("anything", PrimitiveType.BOOLEAN)).toBe(
          false
        );
      });
    });
  });

  describe("getDefaultPrimitiveValue", () => {
    describe("optional fields", () => {
      it("should return empty string for all types when not required", () => {
        expect(
          getDefaultPrimitiveValue(PrimitiveType.STRING, false)
        ).toBe("");
        expect(
          getDefaultPrimitiveValue(PrimitiveType.NUMBER, false)
        ).toBe("");
        expect(
          getDefaultPrimitiveValue(PrimitiveType.BOOLEAN, false)
        ).toBe("");
      });
    });

    describe("required fields", () => {
      it("should return empty string for STRING type", () => {
        expect(getDefaultPrimitiveValue(PrimitiveType.STRING, true)).toBe("");
      });

      it("should return 0 for NUMBER type", () => {
        expect(getDefaultPrimitiveValue(PrimitiveType.NUMBER, true)).toBe(0);
      });

      it("should return false for BOOLEAN type", () => {
        expect(getDefaultPrimitiveValue(PrimitiveType.BOOLEAN, true)).toBe(
          false
        );
      });
    });
  });

  describe("detectPrimitiveType", () => {
    it("should detect boolean values", () => {
      expect(detectPrimitiveType(true)).toBe(PrimitiveType.BOOLEAN);
      expect(detectPrimitiveType(false)).toBe(PrimitiveType.BOOLEAN);
    });

    it("should detect number values", () => {
      expect(detectPrimitiveType(0)).toBe(PrimitiveType.NUMBER);
      expect(detectPrimitiveType(42)).toBe(PrimitiveType.NUMBER);
      expect(detectPrimitiveType(3.14)).toBe(PrimitiveType.NUMBER);
      expect(detectPrimitiveType(-10)).toBe(PrimitiveType.NUMBER);
    });

    it("should default to STRING for string values", () => {
      expect(detectPrimitiveType("hello")).toBe(PrimitiveType.STRING);
      expect(detectPrimitiveType("")).toBe(PrimitiveType.STRING);
      expect(detectPrimitiveType("42")).toBe(PrimitiveType.STRING);
    });

    it("should default to STRING for null and undefined", () => {
      expect(detectPrimitiveType(null)).toBe(PrimitiveType.STRING);
      expect(detectPrimitiveType(undefined)).toBe(PrimitiveType.STRING);
    });

    it("should default to STRING for objects and arrays", () => {
      expect(detectPrimitiveType({})).toBe(PrimitiveType.STRING);
      expect(detectPrimitiveType([])).toBe(PrimitiveType.STRING);
      expect(detectPrimitiveType({ key: "value" })).toBe(PrimitiveType.STRING);
    });
  });
});
