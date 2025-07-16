import { JSONSchema } from "zod/v4/core";

/**
 * Type guard to check if a field is nullable (can be null)
 */
export function isNullable(schema: JSONSchema.BaseSchema): boolean {
  const { isNullable } = extractFirstNotNullableSchema(schema);
  return isNullable;
}

/**
 * Determine if a schema represents a simple type (string, number, boolean)
 */
export function isSimpleTypeSchema(schema: JSONSchema.BaseSchema): boolean {
  return (
    schema.type === "string" ||
    schema.type === "number" ||
    schema.type === "integer" ||
    schema.type === "boolean" ||
    schema.type === "null"
  );
}

/**
 * Get the schema type for a value
 */
export function getSchemaType(schema: JSONSchema.BaseSchema): string {
  if (typeof schema !== "object" || schema === null) {
    return "unknown";
  }

  if (schema.type === undefined && "anyOf" in schema) {
    const unionSchema = schema as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    // For union, find the first non-null type
    const nonNullSchema = unionSchema.anyOf?.find(
      (subSchema: JSONSchema.BaseSchema) => subSchema.type !== "null",
    );
    if (nonNullSchema) {
      return getSchemaType(nonNullSchema);
    }
    return unionSchema.anyOf?.[0]
      ? getSchemaType(unionSchema.anyOf[0])
      : "unknown";
  }

  if (schema.type === undefined && "allOf" in schema) {
    const intersectSchema = schema as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    // For intersect, find the first non-null type
    const nonNullSchema = intersectSchema.allOf?.find(
      (subSchema: JSONSchema.BaseSchema) => subSchema.type !== "null",
    );
    if (nonNullSchema) {
      return getSchemaType(nonNullSchema);
    }
    return intersectSchema.allOf?.[0]
      ? getSchemaType(intersectSchema.allOf[0])
      : "unknown";
  }

  if (!schema.type) {
    return "unknown";
  }

  // Return the schema type directly
  return schema.type;
}

/**
 * Helper functions to check schema types
 */
export function isArraySchema(
  schema: JSONSchema.BaseSchema,
): schema is JSONSchema.ArraySchema {
  return schema.type === "array";
}

export function extractFirstNotNullableSchema(schema: JSONSchema.BaseSchema): {
  isNullable: boolean;
  schema?: JSONSchema.BaseSchema;
} {
  // Check if it's a union that includes null
  if (schema.type === undefined && schema.anyOf) {
    const anyNullable =
      schema.anyOf?.some(
        (subSchema: JSONSchema.BaseSchema) => subSchema.type === "null",
      ) ?? false;
    if (anyNullable) {
      return {
        isNullable: true,
        schema: schema.anyOf?.find(
          (subSchema: JSONSchema.BaseSchema) => subSchema.type !== "null",
        ),
      };
    }
    return { isNullable: false, schema: schema };
  }

  // Check if it's an intersection that includes null
  if (schema.type === undefined && schema.allOf) {
    const allNullable =
      schema.allOf?.some(
        (subSchema: JSONSchema.BaseSchema) => subSchema.type === "null",
      ) ?? false;
    if (allNullable) {
      return { isNullable: true, schema: undefined };
    }
    return { isNullable: false, schema: schema };
  }

  const isNullType = schema.type === "null";
  return { isNullable: isNullType, schema: isNullType ? undefined : schema };
}

export function isObjectSchema(
  schema: JSONSchema.BaseSchema,
): schema is JSONSchema.ObjectSchema {
  return schema.type === "object";
}

/**
 * Convert snake_case or camelCase to Title Case
 */
export function snakeOrCamelToTitle(str: string): string {
  return str
    .replace(/_([a-z])/g, " $1")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^[a-z]/, (letter) => letter.toUpperCase())
    .replace(/\s+([a-z])/g, (_, letter) => " " + letter.toUpperCase());
}

/**
 * Coerce a value to match the expected schema type
 */
export function coerceValueToSchemaType(
  value: unknown,
  schema: JSONSchema.BaseSchema,
): unknown {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const schemaType = getSchemaType(schema);

  switch (schemaType) {
    case "number":
    case "integer":
      if (typeof value === "string") {
        const parsed = Number(value);
        return isNaN(parsed) ? value : parsed;
      }
      return value;

    case "boolean":
      if (typeof value === "string") {
        const lower = value.toLowerCase();
        if (lower === "true" || lower === "1") return true;
        if (lower === "false" || lower === "0") return false;
      }
      return Boolean(value);

    case "string":
      return String(value);

    default:
      // For complex types (object, array) or unknown types, return as-is
      return value;
  }
}
