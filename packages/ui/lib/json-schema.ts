import { z } from "zod/v4";
import { JSONSchema } from "zod/v4/core";

export interface ZodToJsonSchemaOptions<T extends z.ZodRawShape> {
  selectFields?: (keyof T)[];
  firstFields?: (keyof T)[];
  lastFields?: (keyof T)[];
  hideFields?: (keyof T)[];
}

export function zodToJsonSchema<T extends z.ZodRawShape>(
  zodSchema: z.ZodObject<T>,
  {
    selectFields,
    firstFields = [],
    lastFields = [],
    hideFields = [],
  }: ZodToJsonSchemaOptions<T> = {},
): JSONSchema.ObjectSchema {
  const jsonSchema: JSONSchema.BaseSchema = z.toJSONSchema(zodSchema, {
    reused: "inline",
  });
  const jsonObjectSchema = jsonSchema as JSONSchema.ObjectSchema;
  const updatedProperties = { ...jsonObjectSchema.properties };

  const exclude = new Set(hideFields);
  const shiftedFields = new Set((firstFields || []).concat(lastFields || []));
  const rawOrder: (keyof T)[] = (firstFields || [])
    .concat(
      (selectFields ?? (Object.keys(updatedProperties) as (keyof T)[])).filter(
        (x) => !shiftedFields.has(x),
      ),
    )
    .concat(lastFields || []);

  const orderedAndFiltered = rawOrder.filter((field) => {
    if (exclude.has(field)) {
      return false;
    }
    exclude.add(field);
    return true;
  });
  const result = {
    ...jsonObjectSchema,
    properties: orderedAndFiltered.reduce(
      (acc, field) => {
        const key = String(field);
        if (updatedProperties[key] !== undefined) {
          acc[key] = updatedProperties[key] as JSONSchema.BaseSchema;
        }
        return acc;
      },
      {} as Record<string, JSONSchema.BaseSchema>,
    ),
  };

  // Return as JSONSchema.ObjectSchema
  return result as JSONSchema.ObjectSchema;
}

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
    const unionSchema = schema as JSONSchema.BaseSchema & {
      anyOf: JSONSchema.BaseSchema[];
    };
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
    const intersectSchema = schema as JSONSchema.BaseSchema & {
      allOf: JSONSchema.BaseSchema[];
    };
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
