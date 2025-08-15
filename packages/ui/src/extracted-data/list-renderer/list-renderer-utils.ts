import type { FieldSchemaMetadata } from "../schema-reconciliation";
import {
  lookupFieldSchemaMetadata,
  getDefaultValueForType,
} from "../schema-metadata-lookup";

// Utility function to build full path for array item
export function buildArrayItemPath(keyPath: string[], index: number): string {
  return [...keyPath, String(index)].join(".");
}

// Utility function to check if array item is changed
export function isArrayItemChanged(
  changedPaths: Set<string> | undefined,
  keyPath: string[],
  index: number
): boolean {
  if (!changedPaths) return false;
  const fullPath = buildArrayItemPath(keyPath, index);
  return changedPaths.has(fullPath);
}

/**
 * UNIFIED ARRAY ITEM DEFAULT VALUE GENERATION
 * ===========================================
 *
 * Get default value for a new array item using normalized path lookup.
 * Uses the same "*" wildcard lookup as both list and table renderers.
 *
 * Algorithm:
 * 1. Build normalized item path using "*" wildcard: ["tags"] → ["tags", "*"]
 * 2. Look up field metadata using shared lookup utility
 * 3. Generate appropriate default value based on schemaType
 */
export function getArrayItemDefaultValue(
  keyPath: string[],
  fieldMetadata: Record<string, FieldSchemaMetadata>
): string | number | boolean {
  // Use shared metadata lookup utility - no code duplication!
  const itemFieldPath = [...keyPath, "*"];
  const itemMetadata = lookupFieldSchemaMetadata(itemFieldPath, fieldMetadata);

  if (!itemMetadata?.schemaType) {
    // No item metadata available, default to empty string
    return "";
  }

  // Use shared default value generation
  return getDefaultValueForType(itemMetadata.schemaType);
}
