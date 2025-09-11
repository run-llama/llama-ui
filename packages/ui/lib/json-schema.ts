import { z } from "zod/v4";
import { JSONSchema } from "zod/v4/core";

export interface JsonSchemaReformatOptions<T extends object = Record<string, never>> {
  selectFields?: (keyof T)[];
  firstFields?: (keyof T)[];
  lastFields?: (keyof T)[];
  hideFields?: (keyof T)[];
  dereference?: boolean;
}

export function zodToJsonSchema<T extends z.ZodRawShape>(
  zodSchema: z.ZodObject<T>,
  options: Omit<JsonSchemaReformatOptions<T>, "dereference"> = {}
): JSONSchema.ObjectSchema {
  const jsonSchema: JSONSchema.BaseSchema = z.toJSONSchema(zodSchema, {
    reused: "inline",
  });
  return modifyJsonSchema(jsonSchema, options);
}

export function modifyJsonSchema<T extends object = Record<string, never>>(
  jsonSchema: JSONSchema.BaseSchema,
  {
    selectFields,
    firstFields = [],
    lastFields = [],
    hideFields = [],
    dereference = true,
  }: JsonSchemaReformatOptions<T>
): JSONSchema.ObjectSchema {
  let jsonObjectSchema = jsonSchema as JSONSchema.ObjectSchema;
  if (dereference) {
    jsonObjectSchema = derefLocalRefs(jsonObjectSchema);
  }
  const updatedProperties = { ...jsonObjectSchema.properties };

  const exclude = new Set(hideFields);
  const shiftedFields = new Set((firstFields || []).concat(lastFields || []));
  const rawOrder: (keyof T)[] = (firstFields || [])
    .concat(
      (selectFields ?? (Object.keys(updatedProperties) as (keyof T)[])).filter(
        (x) => !shiftedFields.has(x)
      )
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
      {} as Record<string, JSONSchema.BaseSchema>
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
      (subSchema: JSONSchema.BaseSchema) => subSchema.type !== "null"
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
      (subSchema: JSONSchema.BaseSchema) => subSchema.type !== "null"
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
  schema: JSONSchema.BaseSchema
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
        (subSchema: JSONSchema.BaseSchema) => subSchema.type === "null"
      ) ?? false;
    if (anyNullable) {
      return {
        isNullable: true,
        schema: schema.anyOf?.find(
          (subSchema: JSONSchema.BaseSchema) => subSchema.type !== "null"
        ),
      };
    }
    return { isNullable: false, schema: schema };
  }

  // Check if it's an intersection that includes null
  if (schema.type === undefined && schema.allOf) {
    const allNullable =
      schema.allOf?.some(
        (subSchema: JSONSchema.BaseSchema) => subSchema.type === "null"
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
  schema: JSONSchema.BaseSchema
): schema is JSONSchema.ObjectSchema {
  return schema.type === "object";
}

export function derefLocalRefs<T extends JSONSchema.BaseSchema>(schema: T): T {
  const root = schema;
  // Use a JSON-like structural type to avoid `any`
  type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
  const cache = new Map<object, JsonValue>(); // handle cycles

  function cloneAndDeref(node: JsonValue, trail: string[] = []): JsonValue {
    if (node && typeof node === "object") {
      const key = node as object;
      if (cache.has(key)) return cache.get(key)!;

      // $ref?
      if (!Array.isArray(node)) {
        const obj = node as { [key: string]: JsonValue };
        const refValue = obj["$ref"];
        if (typeof refValue === "string" && refValue.startsWith("#/")) {
          const target = resolvePointer(root, refValue) as unknown as JsonValue;
          // merge with siblings (spec allows siblings, could either merge or override)
          const rest: { [key: string]: JsonValue } = { ...obj };
          delete rest["$ref"];
          const expanded = cloneAndDeref(target, trail.concat([refValue]));
          return cloneAndDeref({ ...(expanded as object), ...rest } as JsonValue, trail);
        }
      }

      const out: JsonValue = Array.isArray(node) ? [] : {};
      cache.set(key, out);
      for (const [k, v] of Object.entries(node)) {
        (out as { [key: string]: JsonValue })[k] = cloneAndDeref(v as JsonValue, trail.concat([k]));
      }
      return out;
    }
    return node;
  }

  return cloneAndDeref(schema as unknown as JsonValue) as unknown as T;
}

function resolvePointer(obj: unknown, pointer: string) {
  // pointer like "#/foo/bar"
  const parts = pointer.slice(2).split("/").map(unescapeToken);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") {
      throw new Error(`Pointer ${pointer} not found at "${p}"`);
    }
    if (Array.isArray(cur)) {
      const index = Number(p);
      if (!Number.isInteger(index) || index < 0 || index >= cur.length) {
        throw new Error(`Pointer ${pointer} not found at "${p}"`);
      }
      cur = cur[index];
    } else {
      const objCur = cur as Record<string, unknown>;
      if (!(p in objCur)) {
        throw new Error(`Pointer ${pointer} not found at "${p}"`);
      }
      cur = objCur[p];
    }
  }
  return cur;
}

function unescapeToken(t: string) {
  return t.replace(/~1/g, "/").replace(/~0/g, "~");
}

