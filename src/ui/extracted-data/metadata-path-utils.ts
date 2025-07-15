import type { FieldMetadata } from "./schema-reconciliation";
import { lookupFieldMetadata } from "./metadata-lookup-utils";

/**
 * Construct metadata lookup path for table headers
 * For table columns, we need to find metadata using the first row (index 0) as reference
 *
 * @param parentKeyPath - The parent path (e.g., ["items"])
 * @param columnPath - The column path from flattenObject (e.g., ["period", "start"])
 * @param depth - Current depth in the column path
 * @returns The full key path for metadata lookup
 */
export function buildTableHeaderMetadataPath(
  parentKeyPath: string[],
  columnPath: string[],
  depth: number,
): string[] {
  // For table headers, use index 0 as reference for metadata lookup
  // This converts paths like ["items"] + ["period", "start"] at depth 1
  // to ["items", "0", "period", "start"] for metadata lookup
  return [...parentKeyPath, "0", ...columnPath.slice(0, depth + 1)];
}

/**
 * UNIFIED FIELD METADATA LOOKUP ALGORITHM
 * =======================================
 *
 * Find field metadata using normalized path lookup with "*" wildcards.
 * This algorithm unifies list and table renderers to use the same lookup mechanism.
 *
 * Delegates to the shared lookup utility to avoid code duplication.
 *
 * @param keyPath - The full key path (e.g., ["users", "2", "name"])
 * @param fieldMetadata - The metadata lookup object with normalized keys
 * @returns The field metadata or undefined if not found
 */
export function findFieldMetadata(
  keyPath: string[],
  fieldMetadata: Record<string, FieldMetadata>,
): FieldMetadata | undefined {
  return lookupFieldMetadata(keyPath, fieldMetadata);
}
