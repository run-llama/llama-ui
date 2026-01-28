import type {
  ExtractedFieldMetadataDict,
  ExtractedFieldMetadata,
} from "@/src/lib/agent-data";

/**
 * Find metadata for a specific field path in the API metadata object
 * The metadata structure mirrors the data structure (tree-like)
 *
 * Algorithm:
 * Direct tree traversal following the exact path structure:
 * - For objects: metadata.merchant.name
 * - For arrays: metadata.items[0].description
 *
 * IMPORTANT: Metadata can cascade down to leaves. A parent node can have
 * ExtractedFieldMetadata (confidence, citation, reasoning, etc.) AND still have children.
 * We cascade parent metadata to children as a safety measure in case the backend
 * doesn't merge it during parsing. Child metadata takes precedence over parent.
 *
 * @param path - The field path as a string (e.g., "merchant.name") or array of path segments
 * @param metadata - The metadata object from API (ExtractedFieldMetadataDict)
 * @returns The metadata for the field, or undefined if not found
 */
export function findExtractedFieldMetadata(
  path: string | string[],
  metadata: ExtractedFieldMetadataDict
): ExtractedFieldMetadata | undefined {
  // Convert string path to array
  const pathArray = Array.isArray(path) ? path : path.split(".");

  // Direct tree traversal following the exact path structure
  let current: unknown = metadata;
  let accumulatedParentMetadata: ExtractedFieldMetadata | undefined = undefined;

  for (let i = 0; i < pathArray.length; i++) {
    const segment = pathArray[i];

    if (!current || typeof current !== "object") {
      return undefined;
    }

    // Check if current node has metadata before traversing to children
    // If it does, merge it with accumulated parent metadata (most recent takes precedence)
    // This allows earlier parents to provide fallback values for fields later parents don't have
    if (isExtractedFieldMetadata(current)) {
      accumulatedParentMetadata = mergeMetadata(
        accumulatedParentMetadata,
        current
      );
    }

    // Handle array indices
    if (!isNaN(Number(segment))) {
      if (Array.isArray(current)) {
        const index = Number(segment);
        current = current[index];
      } else {
        // If we expect an array but current is not an array, path doesn't exist
        return undefined;
      }
    } else {
      // Handle object properties
      // Note: Even if current is ExtractedFieldMetadata, it's still an object
      // and can have child properties, so we continue traversing
      current = (current as Record<string, unknown>)[segment];
    }

    // If we've reached the end of the path, check if what we found is metadata
    if (i === pathArray.length - 1) {
      if (isExtractedFieldMetadata(current)) {
        // Child has metadata - merge with accumulated parent (child takes precedence)
        return mergeMetadata(accumulatedParentMetadata, current);
      }
      // Child doesn't have metadata, but accumulated parent might - return it if it exists
      return accumulatedParentMetadata;
    }

    // Continue traversing even if current is metadata - metadata can have children
  }

  return undefined;
}

/**
 * Merge parent and child metadata, with child metadata taking precedence
 * This implements cascading behavior as a safety measure in case the backend
 * doesn't merge parent metadata into children during parsing
 */
function mergeMetadata(
  parent: ExtractedFieldMetadata | undefined,
  child: ExtractedFieldMetadata
): ExtractedFieldMetadata {
  if (!parent) {
    return child;
  }

  // Merge metadata: child takes precedence, but parent provides fallback values
  // This ensures parent metadata (like reasoning) cascades down to children
  return {
    ...parent,
    ...child,
    // For arrays like citation, child citation is more specific, so we use child's
  } as ExtractedFieldMetadata;
}

/**
 * Type guard to check if a value is ExtractedFieldMetadata
 */
export function isExtractedFieldMetadata(
  value: unknown
): value is ExtractedFieldMetadata {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check for ExtractedFieldMetadata indicators:
  // - confidence (numeric) is the primary indicator
  // - citation (array) is also a strong indicator of metadata
  // Having either indicates this is metadata rather than a nested object
  if ("confidence" in obj && typeof obj.confidence === "number") {
    return true;
  }

  // Also check for citation array as an indicator
  if ("citation" in obj && Array.isArray(obj.citation)) {
    return true;
  }

  return false;
}

/**
 * Recursively build metadata paths for nested data structures
 * This helps with understanding all possible paths in a data object
 *
 * @param data - The data object to analyze
 * @param prefix - Current path prefix
 * @returns Array of all paths found in the data
 */
export function buildMetadataPaths(
  data: unknown,
  prefix: string = ""
): string[] {
  const paths: string[] = [];

  if (!data || typeof data !== "object") {
    return paths;
  }

  if (Array.isArray(data)) {
    data.forEach((_, index) => {
      const itemPath = prefix ? `${prefix}.${index}` : `${index}`;
      paths.push(itemPath);
      paths.push(...buildMetadataPaths(data[index], itemPath));
    });
  } else {
    Object.entries(data).forEach(([key, value]) => {
      const keyPath = prefix ? `${prefix}.${key}` : key;
      paths.push(keyPath);
      paths.push(...buildMetadataPaths(value, keyPath));
    });
  }

  return paths;
}
