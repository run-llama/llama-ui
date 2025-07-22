import { z } from "zod/v4";
import { describe, expect, it } from "vitest";
import {
  zodToJsonSchema,
  modifyJsonSchema,
  derefLocalRefs,
} from "@/lib/json-schema";
import { JSONSchema } from "zod/v4/core";

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

  describe("reference dereferencing", () => {
    it("should dereference $ref schemas when dereference is true", () => {
      // Create a schema with references
      const schemaWithRefs = {
        type: "object" as const,
        properties: {
          user: {
            $ref: "#/definitions/User",
          },
          name: {
            type: "string" as const,
          },
        },
        definitions: {
          User: {
            type: "object" as const,
            properties: {
              firstName: { type: "string" as const },
              age: { type: "number" as const },
            },
            required: ["firstName", "age"],
          },
        },
      };

      const result = modifyJsonSchema(schemaWithRefs, { dereference: true });

      // Verify that the result doesn't contain $ref properties
      expect(result.properties!.user).not.toHaveProperty("$ref");

      // Verify that the referenced schema is properly inlined
      expect(result.properties!.user).toEqual({
        type: "object",
        properties: {
          firstName: { type: "string" },
          age: { type: "number" },
        },
        required: ["firstName", "age"],
      });

      // Verify that non-ref properties are preserved
      expect(result.properties!.name).toEqual({ type: "string" });
    });

    it("should preserve $ref schemas when dereference is false", () => {
      const schemaWithRefs = {
        type: "object" as const,
        properties: {
          user: {
            $ref: "#/definitions/User",
          },
        },
        definitions: {
          User: {
            type: "object" as const,
            properties: {
              name: { type: "string" as const },
            },
          },
        },
      };

      const result = modifyJsonSchema(schemaWithRefs, { dereference: false });

      // Verify that $ref is preserved when dereference is false
      expect(result.properties!.user).toHaveProperty(
        "$ref",
        "#/definitions/User"
      );
    });
  });
});

describe("derefLocalRefs()", () => {
  it("inlines a simple local $ref", () => {
    const schema: JSONSchema.ObjectSchema = {
      $defs: {
        Foo: { type: "string", minLength: 3 },
      },
      type: "object",
      properties: {
        name: { $ref: "#/$defs/Foo" },
      },
    };

    const out = derefLocalRefs(schema) as any;

    expect(out.properties!.name).toEqual({ type: "string", minLength: 3 });
    // Ensure original still has $ref
    expect(schema.properties!.name).toEqual({ $ref: "#/$defs/Foo" });
  });

  it("handles nested refs and arrays of refs", () => {
    const schema: JSONSchema.ArraySchema = {
      $defs: {
        Bar: { type: "number", minimum: 0 },
        Baz: {
          type: "object",
          properties: {
            bar: { $ref: "#/$defs/Bar" },
          },
        },
      },
      type: "array",
      items: { $ref: "#/$defs/Baz" },
    };

    const out = derefLocalRefs(schema) as any;
    expect(out.items).toEqual({
      type: "object",
      properties: {
        bar: { type: "number", minimum: 0 },
      },
    });
    expect(out.items.properties.bar.minimum).toBe(0);
  });

  it("merges siblings next to $ref (ref + overrides)", () => {
    const schema: JSONSchema.BaseSchema = {
      $defs: {
        Num: { type: "number", minimum: 0 },
      },
      properties: {
        count: {
          $ref: "#/$defs/Num",
          description: "overridden description",
          minimum: 10, // override
        },
      },
    };

    const out = derefLocalRefs(schema) as any;
    expect(out.properties.count).toEqual({
      type: "number",
      minimum: 10,
      description: "overridden description",
    });
  });

  it("throws if a pointer is missing", () => {
    const schema = {
      properties: {
        foo: { $ref: "#/missing/thing" },
      },
    };

    expect(() => derefLocalRefs(schema)).toThrow(
      /Pointer #\/missing\/thing not found/
    );
  });

  it("resolves JSON Pointer escape sequences (~0 -> ~, ~1 -> /)", () => {
    const schema = {
      $defs: {
        "tilde~key": { enum: ["~"] },
        "slash/key": { enum: ["/"] },
      },
      props: {
        tilde: { $ref: "#/$defs/tilde~0key" }, // ~0 -> ~
        slash: { $ref: "#/$defs/slash~1key" }, // ~1 -> /
      },
    };

    const out = derefLocalRefs(schema);
    expect(out.props.tilde).toEqual({ enum: ["~"] });
    expect(out.props.slash).toEqual({ enum: ["/"] });
  });

  it("deep clones targets so changes to output do not affect originals", () => {
    const schema: JSONSchema.BaseSchema = {
      $defs: {
        Foo: { type: "number", minimum: 1 },
      },
      props: {
        a: { $ref: "#/$defs/Foo" },
        b: { $ref: "#/$defs/Foo" },
      },
    };

    const out = derefLocalRefs(schema) as any;
    out.props.a.minimum = 99;

    // Original $defs untouched
    expect((schema as any).$defs.Foo.minimum).toBe(1);
    // Second usage not affected
    expect(out.props.b.minimum).toBe(1);
  });

  it("handles object reuse without infinite recursion (simple self-cycle)", () => {
    // Construct a self-referential schema:
    const schema: any = {
      $defs: {},
      node: { type: "object", properties: { self: { $ref: "#/node" } } },
    };

    // NOTE: Our simple implementation may or may not handle this depending on cache logic.
    // If it does, result will have an object graph that references itself; JSON.stringify will fail.
    // We can still test that it doesn’t crash.
    expect(() => derefLocalRefs(schema)).not.toThrow();
  });

  it("leaves non-ref fields alone", () => {
    const schema: JSONSchema.ObjectSchema = {
      type: "object",
      properties: {
        x: { type: "integer", maximum: 5 },
      },
    };

    const out = derefLocalRefs(schema);
    expect(out).toEqual(schema);
    expect((out as any).properties.x.maximum).toBe(5);
  });

  it("handles multiple levels of nested objects and arrays", () => {
    const schema: JSONSchema.BaseSchema = {
      $defs: {
        Stringy: { type: "string" },
        ArrayOfStringy: { type: "array", items: { $ref: "#/$defs/Stringy" } },
      },
      type: "object",
      properties: {
        list: { $ref: "#/$defs/ArrayOfStringy" },
      },
    };

    const out = derefLocalRefs(schema) as any;
    expect(out.properties!.list).toEqual({
      type: "array",
      items: { type: "string" },
    });
  });
});
