import type { FieldSchemaMetadata } from "./schema-reconciliation";

/**
 * CORE METADATA LOOKUP UTILITIES
 * ==============================
 *
 * Pure utility functions for field metadata lookup without any circular dependencies.
 * These functions can be safely imported by any module in the extracted-data system.
 */

/**
 * Core path normalization logic - converts numeric indices to "*" wildcards
 * Examples:
 * - "users.2.name" → "users.*.name"
 * - "tags.0" → "tags.*"
 */
export function normalizeMetadataPath(pathString: string): string {
  return pathString.replace(/\.\d+(?=\.|$)/g, ".*");
}

/**
 * Core metadata lookup with normalization fallback
 * This is the unified algorithm used by all renderers
 */
export function lookupFieldSchemaMetadata(
  keyPath: string[],
  fieldSchemaMetadata: Record<string, FieldSchemaMetadata>
): FieldSchemaMetadata | undefined {
  const pathString = keyPath.join(".");

  // Step 1: Try exact path match first
  let metadata = fieldSchemaMetadata[pathString];
  if (metadata) {
    return metadata;
  }

  // Step 2: Try normalized path with "*" wildcards
  const normalizedPath = normalizeMetadataPath(pathString);
  metadata = fieldSchemaMetadata[normalizedPath];
  if (metadata) {
    return metadata;
  }

  // Step 3: For paths without indices, try adding wildcard patterns
  // Example: "items.description" -> "items.*.description"
  if (!pathString.includes(".") || !pathString.match(/\.\d+\./)) {
    // Try inserting wildcard after each segment except the last
    const segments = keyPath;
    if (segments.length > 1) {
      for (let i = 1; i < segments.length; i++) {
        const wildcardPath = [
          ...segments.slice(0, i),
          "*",
          ...segments.slice(i),
        ].join(".");
        metadata = fieldSchemaMetadata[wildcardPath];
        if (metadata) {
          return metadata;
        }
      }
    }
  }

  return metadata;
}

/**
 * Get default value for a primitive type
 */
export function getDefaultValueForType(
  schemaType: string
): string | number | boolean {
  const PrimitiveType = {
    STRING: "string",
    NUMBER: "number",
    BOOLEAN: "boolean",
  };

  switch (schemaType) {
    case PrimitiveType.STRING:
      return "";
    case PrimitiveType.NUMBER:
      return 0;
    case PrimitiveType.BOOLEAN:
      return false;
    default:
      return "";
  }
}
