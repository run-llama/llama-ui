import { z } from "zod/v4";
import { describe, expect, it } from "vitest";
import { zodToJsonSchema } from "@llamaindex/ui/lib/json-schema";

describe("zodToJsonSchema", () => {
  // Test schema with multiple fields for ordering tests
  const testSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    age: z.number(),
    address: z.string(),
    phone: z.string(),
    status: z.string(),
  });

  describe("basic functionality", () => {
    it("should convert zod schema to JSON schema without options", () => {
      const result = zodToJsonSchema(testSchema);

      expect(result.type).toBe("object");
      expect(result.properties).toBeDefined();
      expect(Object.keys(result.properties!)).toEqual([
        "id",
        "name",
        "email",
        "age",
        "address",
        "phone",
        "status",
      ]);
    });

    it("should preserve all field properties", () => {
      const result = zodToJsonSchema(testSchema);

      expect(result.properties!.id).toEqual({ type: "string" });
      expect(result.properties!.name).toEqual({ type: "string" });
      expect(result.properties!.age).toEqual({ type: "number" });
    });
  });

  describe("filterFields option", () => {
    it("should only include specified fields when filterFields is provided", () => {
      const result = zodToJsonSchema(testSchema, {
        selectFields: ["name", "email", "age"],
      });

      expect(Object.keys(result.properties!)).toEqual(["name", "email", "age"]);
    });

    it("should maintain order of filterFields", () => {
      const result = zodToJsonSchema(testSchema, {
        selectFields: ["age", "name", "email"],
      });

      expect(Object.keys(result.properties!)).toEqual(["age", "name", "email"]);
    });

    it("should handle empty filterFields array", () => {
      const result = zodToJsonSchema(testSchema, {
        selectFields: [],
      });

      expect(Object.keys(result.properties!)).toEqual([]);
    });
  });

  describe("firstFields option", () => {
    it("should move specified fields to the beginning", () => {
      const result = zodToJsonSchema(testSchema, {
        firstFields: ["status", "name"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys.slice(0, 2)).toEqual(["status", "name"]);
      expect(keys).toContain("id");
      expect(keys).toContain("email");
    });

    it("should work with single firstField", () => {
      const result = zodToJsonSchema(testSchema, {
        firstFields: ["email"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys[0]).toBe("email");
    });

    it("should handle firstFields that don't exist in schema", () => {
      const result = zodToJsonSchema(testSchema, {
        firstFields: ["nonexistent" as keyof typeof testSchema.shape, "name"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys[0]).toBe("name"); // nonexistent should be ignored
    });
  });

  describe("lastFields option", () => {
    it("should move specified fields to the end", () => {
      const result = zodToJsonSchema(testSchema, {
        lastFields: ["phone", "address"],
      });

      const keys = Object.keys(result.properties!);
      const lastTwo = keys.slice(-2);
      expect(lastTwo).toEqual(["phone", "address"]);
    });

    it("should work with single lastField", () => {
      const result = zodToJsonSchema(testSchema, {
        lastFields: ["status"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys[keys.length - 1]).toBe("status");
    });
  });

  describe("hideFields option", () => {
    it("should exclude specified fields from the result", () => {
      const result = zodToJsonSchema(testSchema, {
        hideFields: ["phone", "address"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys).not.toContain("phone");
      expect(keys).not.toContain("address");
      expect(keys).toContain("name");
      expect(keys).toContain("email");
    });

    it("should handle hiding all fields", () => {
      const result = zodToJsonSchema(testSchema, {
        hideFields: [
          "id",
          "name",
          "email",
          "age",
          "address",
          "phone",
          "status",
        ],
      });

      expect(Object.keys(result.properties!)).toEqual([]);
    });
  });

  describe("combined options", () => {
    it("should work with firstFields and lastFields together", () => {
      const result = zodToJsonSchema(testSchema, {
        firstFields: ["status"],
        lastFields: ["phone"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys[0]).toBe("status");
      expect(keys[keys.length - 1]).toBe("phone");
      expect(keys.length).toBe(7); // all fields should be present
    });

    it("should work with filterFields and firstFields", () => {
      const result = zodToJsonSchema(testSchema, {
        selectFields: ["name", "email", "age", "status"],
        firstFields: ["status"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys).toEqual(["status", "name", "email", "age"]);
    });

    it("should work with filterFields and lastFields", () => {
      const result = zodToJsonSchema(testSchema, {
        selectFields: ["name", "email", "age", "status"],
        lastFields: ["name"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys).toEqual(["email", "age", "status", "name"]);
    });

    it("should work with hideFields and firstFields", () => {
      const result = zodToJsonSchema(testSchema, {
        hideFields: ["phone", "address"],
        firstFields: ["status"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys[0]).toBe("status");
      expect(keys).not.toContain("phone");
      expect(keys).not.toContain("address");
      expect(keys.length).toBe(5); // 7 total - 2 hidden
    });

    it("should work with all options combined", () => {
      const result = zodToJsonSchema(testSchema, {
        selectFields: ["name", "email", "age", "status", "phone"],
        firstFields: ["status"],
        lastFields: ["phone"],
        hideFields: ["age"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys).toEqual(["status", "name", "email", "phone"]);
      expect(keys).not.toContain("age");
    });

    it("should handle overlapping firstFields and lastFields", () => {
      const result = zodToJsonSchema(testSchema, {
        firstFields: ["name"],
        lastFields: ["name"], // same field in both
      });

      const keys = Object.keys(result.properties!);
      // Field should appear only once, preference given to firstFields
      expect(keys.filter((k) => k === "name")).toHaveLength(1);
      expect(keys[0]).toBe("name");
    });

    it("should handle firstFields that are also hidden", () => {
      const result = zodToJsonSchema(testSchema, {
        firstFields: ["name"],
        hideFields: ["name"],
      });

      const keys = Object.keys(result.properties!);
      expect(keys).not.toContain("name");
    });
  });

  describe("edge cases", () => {
    it("should handle empty schema", () => {
      const emptySchema = z.object({});
      const result = zodToJsonSchema(emptySchema);

      expect(result.type).toBe("object");
      expect(Object.keys(result.properties!)).toEqual([]);
    });

    it("should handle schema with one field", () => {
      const singleFieldSchema = z.object({ name: z.string() });
      const result = zodToJsonSchema(singleFieldSchema, {
        firstFields: ["name"],
        lastFields: ["name"],
      });

      expect(Object.keys(result.properties!)).toEqual(["name"]);
    });

    it("should preserve required fields from original schema", () => {
      const requiredSchema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const result = zodToJsonSchema(requiredSchema);

      expect(result.required).toContain("required");
      expect(result.required).not.toContain("optional");
    });
  });
});
