import { describe, expect, it } from "vitest";
import { JSONSchema } from "zod/v4/core";
import {
  reconcileDataWithJsonSchema,
  isFieldRequiredAtPath,
  wasFieldMissingAtPath,
  getFieldMetadataAtPath,
  getValidationErrorsAtPath,
  type FieldMetadata,
} from "@/src/extracted-data/schema-reconciliation";

describe("JSON Schema-based Schema Reconciliation", () => {
  describe("reconcileDataWithJsonSchema", () => {
    it("should fill missing optional fields with undefined", () => {
      const jsonSchema: JSONSchema.ObjectSchema = {
        type: "object",
        properties: {
          name: { type: "string", title: "Name" },
          age: { type: "number", title: "Age" },
          email: { type: "string", title: "Email" },
        },
        required: ["name"],
      };

      const originalData = {
        name: "John Doe",
        age: 30,
      };

      const result = reconcileDataWithJsonSchema(originalData, jsonSchema);

      expect(result.data).toEqual({
        name: "John Doe",
        age: 30,
        email: undefined, // Added missing optional field
      });

      expect(result.addedOptionalFields.has("email")).toBe(true);
      expect(result.addedOptionalFields.has("age")).toBe(false); // Age was present in original data
      expect(result.requiredFields.has("name")).toBe(true);
      expect(result.requiredFields.has("email")).toBe(false);
      expect(result.isValid).toBe(true);
    });

    it("should handle nested objects", () => {
      const jsonSchema: JSONSchema.ObjectSchema = {
        type: "object",
        properties: {
          name: { type: "string", title: "Name" },
          address: {
            type: "object",
            title: "Address",
            properties: {
              street: { type: "string", title: "Street" },
              city: { type: "string", title: "City" },
              zipCode: { type: "string", title: "Zip Code" },
            },
            required: ["street", "city"],
          },
        },
        required: ["name"],
      };

      const originalData = {
        name: "John Doe",
        address: {
          street: "123 Main St",
          city: "Anytown",
        },
      };

      const result = reconcileDataWithJsonSchema(originalData, jsonSchema);

      expect(result.data).toEqual({
        name: "John Doe",
        address: {
          street: "123 Main St",
          city: "Anytown",
          zipCode: undefined, // Added missing optional field
        },
      });

      expect(result.addedOptionalFields.has("address.zipCode")).toBe(true);
      expect(result.requiredFields.has("address.street")).toBe(true);
      expect(result.requiredFields.has("address.city")).toBe(true);
      expect(result.requiredFields.has("address.zipCode")).toBe(false);
    });

    it("should handle arrays of objects", () => {
      const jsonSchema: JSONSchema.ObjectSchema = {
        type: "object",
        properties: {
          name: { type: "string", title: "Name" },
          skills: {
            type: "array",
            title: "Skills",
            items: {
              type: "object",
              properties: {
                name: { type: "string", title: "Skill Name" },
                level: { type: "string", title: "Skill Level" },
                certified: { type: "boolean", title: "Certified" },
              },
              required: ["name"],
            },
          },
        },
        required: ["name"],
      };

      const originalData = {
        name: "John Doe",
        skills: [{ name: "JavaScript", level: "Expert" }, { name: "Python" }],
      };

      const result = reconcileDataWithJsonSchema(originalData, jsonSchema);

      expect(result.data).toEqual({
        name: "John Doe",
        skills: [
          {
            name: "JavaScript",
            level: "Expert",
            certified: undefined,
          },
          {
            name: "Python",
            level: undefined,
            certified: undefined,
          },
        ],
      });

      expect(result.addedOptionalFields.has("skills.0.certified")).toBe(true);
      expect(result.addedOptionalFields.has("skills.1.level")).toBe(true);
      expect(result.addedOptionalFields.has("skills.1.certified")).toBe(true);
      expect(result.requiredFields.has("skills.0.name")).toBe(true);
      expect(result.requiredFields.has("skills.1.name")).toBe(true);
    });

    it("should preserve field metadata with titles and descriptions", () => {
      const jsonSchema: JSONSchema.ObjectSchema = {
        type: "object",
        properties: {
          name: {
            type: "string",
            title: "Full Name",
            description: "The person's full name",
          },
          age: {
            type: "number",
            title: "Age",
            description: "Age in years",
          },
          email: {
            type: "string",
            title: "Email Address",
            description: "Primary email contact",
          },
        },
        required: ["name", "age"],
      };

      const originalData = {
        name: "John Doe",
        age: 25, // Include required field
      };

      const result = reconcileDataWithJsonSchema(originalData, jsonSchema);

      // Check field metadata
      expect(result.metadata.name).toEqual({
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Full Name",
        description: "The person's full name",
        wasMissing: false,
      });

      expect(result.metadata.age).toEqual({
        isRequired: true,
        isOptional: false,
        schemaType: "number",
        title: "Age",
        description: "Age in years",
        wasMissing: false, // Age is present in original data
      });

      expect(result.metadata.email).toEqual({
        isRequired: false,
        isOptional: true,
        schemaType: "string",
        title: "Email Address",
        description: "Primary email contact",
        wasMissing: true,
      });
    });

    it("should handle empty objects gracefully", () => {
      const jsonSchema: JSONSchema.ObjectSchema = {
        type: "object",
        properties: {
          name: { type: "string", title: "Name" },
          age: { type: "number", title: "Age" },
        },
        required: ["name"],
      };

      const originalData = {};

      const result = reconcileDataWithJsonSchema(originalData, jsonSchema);

      expect(result.data).toEqual({
        name: undefined,
        age: undefined,
      });

      expect(result.addedOptionalFields.has("age")).toBe(true);
      expect(result.requiredFields.has("name")).toBe(true);
    });

    it("should handle null and undefined values correctly", () => {
      const jsonSchema: JSONSchema.ObjectSchema = {
        type: "object",
        properties: {
          name: { type: "string", title: "Name" },
          description: { type: "string", title: "Description" },
          active: { type: "boolean", title: "Active" },
          missing: { type: "string", title: "Missing Field" }, // This should be added
        },
        required: ["name"],
      };

      const originalData = {
        name: "John Doe",
        description: null,
        active: undefined,
      };

      const result = reconcileDataWithJsonSchema(originalData, jsonSchema);

      expect(result.data).toEqual({
        name: "John Doe",
        description: null, // Preserve null
        active: undefined, // Preserve undefined
        missing: undefined, // Added by reconciliation
      });

      expect(result.addedOptionalFields.has("description")).toBe(false); // description was present (null)
      expect(result.addedOptionalFields.has("active")).toBe(false); // active was present (undefined)
      expect(result.addedOptionalFields.has("missing")).toBe(true); // missing was added
    });
  });

  describe("Helper functions", () => {
    const mockMetadata: Record<string, FieldMetadata> = {
      name: {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Name",
        wasMissing: false,
      },
      email: {
        isRequired: false,
        isOptional: true,
        schemaType: "string",
        title: "Email",
        wasMissing: true,
      },
      "address.street": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Street",
        wasMissing: false,
      },
    };

    describe("isFieldRequiredAtPath", () => {
      it("should correctly identify required fields", () => {
        expect(isFieldRequiredAtPath(["name"], mockMetadata)).toBe(true);
        expect(isFieldRequiredAtPath(["email"], mockMetadata)).toBe(false);
        expect(isFieldRequiredAtPath(["address", "street"], mockMetadata)).toBe(
          true,
        );
        expect(isFieldRequiredAtPath(["nonexistent"], mockMetadata)).toBe(
          false,
        );
      });
    });

    describe("wasFieldMissingAtPath", () => {
      it("should correctly identify missing fields", () => {
        expect(wasFieldMissingAtPath(["name"], mockMetadata)).toBe(false);
        expect(wasFieldMissingAtPath(["email"], mockMetadata)).toBe(true);
        expect(wasFieldMissingAtPath(["address", "street"], mockMetadata)).toBe(
          false,
        );
        expect(wasFieldMissingAtPath(["nonexistent"], mockMetadata)).toBe(
          false,
        );
      });
    });

    describe("getFieldMetadataAtPath", () => {
      it("should return correct metadata", () => {
        expect(getFieldMetadataAtPath(["name"], mockMetadata)).toEqual(
          mockMetadata.name,
        );
        expect(getFieldMetadataAtPath(["email"], mockMetadata)).toEqual(
          mockMetadata.email,
        );
        expect(getFieldMetadataAtPath(["nonexistent"], mockMetadata)).toBe(
          null,
        );
      });
    });

    describe("getValidationErrorsAtPath", () => {
      const mockErrors = [
        { path: ["name"], message: "Required field missing", code: "required" },
        { path: ["email"], message: "Invalid email format", code: "format" },
        {
          path: ["address", "street"],
          message: "Too short",
          code: "minLength",
        },
      ];

      it("should return errors for specific paths", () => {
        expect(getValidationErrorsAtPath(["name"], mockErrors)).toEqual([
          mockErrors[0],
        ]);
        expect(getValidationErrorsAtPath(["email"], mockErrors)).toEqual([
          mockErrors[1],
        ]);
        expect(
          getValidationErrorsAtPath(["address", "street"], mockErrors),
        ).toEqual([mockErrors[2]]);
        expect(getValidationErrorsAtPath(["nonexistent"], mockErrors)).toEqual(
          [],
        );
      });
    });
  });
});
