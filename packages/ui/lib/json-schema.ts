import { JSONSchema } from "zod/v4/core";

/**
 * Type guard to check if a field is nullable (can be null)
 */
export function isNullable(schema: JSONSchema.BaseSchema): boolean {
  const { isNullable } = extractFirstNotNullableSchema(schema);
  return isNullable;
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

