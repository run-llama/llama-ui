import { JSONSchema } from "zod/v4/core";
import {
  isNullable,
  extractFirstNotNullableSchema,
  getSchemaType,
} from "@/lib/json-schema";
import type { JsonShape, JsonValue } from "./types";

/**
 * JSON SCHEMA-BASED RECONCILIATION DESIGN
 * =======================================
 *
 * PURPOSE:
 * Uses JSON Schema to reconcile extracted data with schema definitions,
 * filling missing optional fields for UI display and providing field metadata.
 *
 * CORE ALGORITHM:
 * 1. Parse JSON Schema to identify all defined fields
 * 2. Extract field metadata (title, required status, type)
 * 3. Fill missing optional fields with undefined values
 * 4. Provide field display information for UI rendering
 *
 * ADVANTAGES:
 * - Standard JSON Schema format with title support
 * - Clear required/optional field distinction
 * - Rich metadata for UI display (title, description)
 * - Compatible with existing schema infrastructure
 */

/**
 * Field metadata for UI rendering
 */
export interface FieldSchemaMetadata {
  /** Whether this field is required by schema */
  isRequired: boolean;
  /** Whether this field can be null/undefined */
  isOptional: boolean;
  /** The JSON schema type */
  schemaType: string;
  /** Field title from schema for display */
  title?: string;
  /** Field description from schema */
  description?: string;
  /** Whether this field was missing from original data */
  wasMissing: boolean;
}

/**
 * UNIFIED FIELD METADATA DESIGN
 * =============================
 *
 * We use normalized paths with "*" wildcards to represent array item schemas:
 * - "users.*" - represents the schema for any item in the users array
 * - "users.*.contact.email" - represents email field of any user's contact
 *
 * This eliminates the need for separate itemType field and unifies
 * list-renderer and table-renderer to use the same lookup mechanism.
 *
 * Example:
 * {
 *   "tags.*": { schemaType: "string", isRequired: false },
 *   "users.*.name": { schemaType: "string", isRequired: true },
 *   "users.*.age": { schemaType: "number", isRequired: false }
 * }
 */

/**
 * Validation error for a specific field
 */
export interface ValidationError {
  /** The field path where error occurred */
  path: string[];
  /** Error message from zod */
  message: string;
  /** Zod error code */
  code: string;
}

/**
 * Result of zod-based reconciliation
 */
export interface ReconciliationResult<S extends JsonShape<S>> {
  /** Complete data with all schema fields filled */
  data: S;
  /** Metadata for each field path */
  // key is the path string, and array index will be replaced with "*"
  // e.g "users.*.name", "users.*.contact.email"
  schemaMetadata: Record<string, FieldSchemaMetadata>;
  /** Set of required field paths */
  requiredFields: Set<string>;
  /** Set of optional field paths that were missing */
  addedOptionalFields: Set<string>;
  /** Validation errors from zod */
  validationErrors: ValidationError[];
  /** Whether validation passed */
  isValid: boolean;
}

/**
 * Reconcile data with JSON schema, filling missing optional fields
 */
export function reconcileDataWithJsonSchema<S extends JsonShape<S>>(
  originalData: S,
  jsonSchema: JSONSchema.ObjectSchema
): ReconciliationResult<S> {
  const metadata: Record<string, FieldSchemaMetadata> = {};
  const requiredFields = new Set<string>();
  const addedOptionalFields = new Set<string>();
  const validationErrors: ValidationError[] = [];

  // Start with original data copy - use structuredClone to preserve undefined values
  const data = structuredClone(originalData);

  // Fill missing fields from JSON schema
  fillMissingFieldsFromJsonSchema<S>(data, jsonSchema, [], {
    metadata,
    requiredFields,
    addedOptionalFields,
    originalData,
  });

  // Basic validation (JSON Schema validation would be more complex)
  // For now, we'll do simple presence validation

  return {
    data,
    schemaMetadata: metadata,
    requiredFields,
    addedOptionalFields,
    validationErrors,
    isValid: validationErrors.length === 0,
  };
}

/**
 * Internal context for reconciliation process
 */
interface ReconciliationContext<S extends JsonShape<S>> {
  metadata: Record<string, FieldSchemaMetadata>;
  requiredFields: Set<string>;
  addedOptionalFields: Set<string>;
  originalData: S;
}

/**
 * Fill missing fields from JSON Schema object
 */
function fillMissingFieldsFromJsonSchema<S extends JsonShape<S>>(
  data: S,
  jsonSchema: JSONSchema.ObjectSchema,
  currentPath: string[],
  context: ReconciliationContext<S>
): void {
  const properties = jsonSchema.properties || {};

  if (
    data === null ||
    data === undefined ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return;
  }

  const dataObj = data as Record<string, JsonValue>;

  // Process all schema fields
  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const fieldPath = [...currentPath, fieldName];
    const pathString = fieldPath.join(".");

    const existsInData = fieldName in dataObj;
    const isRequired =
      (jsonSchema.required?.includes(fieldName) &&
        !isNullable(fieldSchema as JSONSchema.BaseSchema)) ??
      false;
    let wasMissing = false;

    // Handle missing optional fields
    if (!existsInData && !isRequired) {
      dataObj[fieldName] = undefined;
      wasMissing = true;
      context.addedOptionalFields.add(pathString);
    }

    const baseSchema = fieldSchema as JSONSchema.BaseSchema;
    const { schema: primarySchema } = extractFirstNotNullableSchema(baseSchema);
    const effectiveSchema = primarySchema ?? baseSchema;

    // Store metadata using normalized schema (handles anyOf/nullable unions)
    const metadata: FieldSchemaMetadata = {
      isRequired,
      isOptional: !isRequired,
      schemaType: getSchemaType(effectiveSchema),
      title: (effectiveSchema as JSONSchema.BaseSchema).title,
      description: (effectiveSchema as JSONSchema.BaseSchema).description,
      wasMissing,
    };

    context.metadata[pathString] = metadata;

    // UNIFIED ARRAY ITEM SCHEMA GENERATION
    // ===================================
    // For arrays, generate normalized metadata entries for array items
    // using "*" wildcard syntax. This unifies list and table renderer lookup.
    if (effectiveSchema.type === "array") {
      const arraySchema = effectiveSchema as JSONSchema.ArraySchema;
      if (
        arraySchema.items &&
        typeof arraySchema.items === "object" &&
        !Array.isArray(arraySchema.items)
      ) {
        const itemSchema = arraySchema.items as JSONSchema.BaseSchema;

        if (itemSchema.type === "object") {
          // For object arrays, recursively generate metadata for all nested fields
          // Generate paths like "users.*.name", "users.*.contact.email"
          const objectItemSchema = itemSchema as JSONSchema.ObjectSchema;
          generateArrayItemMetadata(
            objectItemSchema,
            [...fieldPath, "*"], // Add "*" wildcard for array items
            context
          );
        } else {
          // For primitive arrays, generate a single metadata entry
          // Generate paths like "tags.*" for string arrays
          const itemPathString = [...fieldPath, "*"].join(".");
          const itemMetadata: FieldSchemaMetadata = {
            isRequired: false, // Array items themselves are not required
            isOptional: true,
            schemaType: getSchemaType(itemSchema),
            title: itemSchema.title,
            description: itemSchema.description,
            wasMissing: false,
          };
          context.metadata[itemPathString] = itemMetadata;
        }
      }
    }

    if (isRequired) {
      context.requiredFields.add(pathString);
    }

    // Recursively process nested objects and arrays
    if (
      effectiveSchema.type === "object" &&
      dataObj[fieldName] !== null &&
      dataObj[fieldName] !== undefined
    ) {
      const objectSchema = effectiveSchema as JSONSchema.ObjectSchema;
      fillMissingFieldsFromJsonSchema<S>(
        dataObj[fieldName] as S,
        objectSchema,
        fieldPath,
        context
      );
    } else if (
      effectiveSchema.type === "array" &&
      Array.isArray(dataObj[fieldName])
    ) {
      const arraySchema = effectiveSchema as JSONSchema.ArraySchema;
      if (
        arraySchema.items &&
        typeof arraySchema.items === "object" &&
        !Array.isArray(arraySchema.items)
      ) {
        const itemSchema = arraySchema.items as JSONSchema.BaseSchema;
        if (itemSchema.type === "object") {
          (dataObj[fieldName] as unknown[]).forEach((item, index) => {
            fillMissingFieldsFromJsonSchema<S>(
              item as S,
              itemSchema as JSONSchema.ObjectSchema,
              [...fieldPath, String(index)],
              context
            );
          });
        }
      }
    }
  }
}

/**
 * Helper function to check if a field is required at a specific path
 */
export function isFieldRequiredAtPath(
  keyPath: string[],
  metadata: Record<string, FieldSchemaMetadata>
): boolean {
  const pathString = keyPath.join(".");
  return metadata[pathString]?.isRequired ?? false;
}

/**
 * Helper function to check if a field was missing from original data
 */
export function wasFieldMissingAtPath(
  keyPath: string[],
  metadata: Record<string, FieldSchemaMetadata>
): boolean {
  const pathString = keyPath.join(".");
  return metadata[pathString]?.wasMissing ?? false;
}

/**
 * Helper function to get field metadata at a specific path
 */
export function getFieldMetadataAtPath(
  keyPath: string[],
  metadata: Record<string, FieldSchemaMetadata>
): FieldSchemaMetadata | null {
  const pathString = keyPath.join(".");
  return metadata[pathString] || null;
}

/**
 * Helper function to get validation errors for a specific path
 */
export function getValidationErrorsAtPath(
  keyPath: string[],
  validationErrors: ValidationError[]
): ValidationError[] {
  const pathString = keyPath.join(".");
  return validationErrors.filter(
    (error) => error.path.join(".") === pathString
  );
}

/**
 * ARRAY ITEM METADATA GENERATION
 * ==============================
 *
 * Recursively generate metadata entries for object array items using "*" wildcards.
 * This creates normalized paths that can be looked up by both list and table renderers.
 *
 * Example: For schema "users.items" with object items containing {name, age, contact: {email}}
 * Generates:
 * - "users.*.name"
 * - "users.*.age"
 * - "users.*.contact.email"
 */
function generateArrayItemMetadata<S extends JsonShape<S>>(
  objectSchema: JSONSchema.ObjectSchema,
  currentPath: string[],
  context: ReconciliationContext<S>
): void {
  const { properties } = objectSchema;
  if (!properties || typeof properties !== "object") {
    return;
  }

  // Process all fields in the object schema
  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const fieldPath = [...currentPath, fieldName];
    const pathString = fieldPath.join(".");
    const baseSchema = fieldSchema as JSONSchema.BaseSchema;
    const { schema: primarySchema } = extractFirstNotNullableSchema(baseSchema);
    const effectiveSchema = primarySchema ?? baseSchema;
    const isRequired = objectSchema.required?.includes(fieldName) ?? false;

    // Generate metadata for this field
    const metadata: FieldSchemaMetadata = {
      isRequired,
      isOptional: !isRequired,
      schemaType: getSchemaType(effectiveSchema),
      title: (effectiveSchema as JSONSchema.BaseSchema).title,
      description: (effectiveSchema as JSONSchema.BaseSchema).description,
      wasMissing: false, // Array item fields are schema-defined, not missing
    };

    context.metadata[pathString] = metadata;

    // Recursively process nested objects
    if (baseSchema.type === "object") {
      const nestedObjectSchema = baseSchema as JSONSchema.ObjectSchema;
      generateArrayItemMetadata(nestedObjectSchema, fieldPath, context);
    }

    // For nested arrays, recursively generate their item metadata too
    if (baseSchema.type === "array") {
      const arraySchema = baseSchema as JSONSchema.ArraySchema;
      if (
        arraySchema.items &&
        typeof arraySchema.items === "object" &&
        !Array.isArray(arraySchema.items)
      ) {
        const itemSchema = arraySchema.items as JSONSchema.BaseSchema;

        if (itemSchema.type === "object") {
          const objectItemSchema = itemSchema as JSONSchema.ObjectSchema;
          generateArrayItemMetadata(
            objectItemSchema,
            [...fieldPath, "*"],
            context
          );
        } else {
          // Primitive array item
          const itemPathString = [...fieldPath, "*"].join(".");
          const itemMetadata: FieldSchemaMetadata = {
            isRequired: false,
            isOptional: true,
            schemaType: itemSchema.type || "unknown",
            title: itemSchema.title,
            description: itemSchema.description,
            wasMissing: false,
          };
          context.metadata[itemPathString] = itemMetadata;
        }
      }
    }
  }
}
