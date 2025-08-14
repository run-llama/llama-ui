import type {
  ExtractedFieldMetadataDict,
  ExtractedFieldMetadata,
} from "llama-cloud-services/beta/agent";

/**
 * Find metadata for a specific field path in the API metadata object
 * The metadata structure mirrors the data structure (tree-like)
 *
 * Algorithm:
 * Direct tree traversal following the exact path structure:
 * - For objects: metadata.merchant.name
 * - For arrays: metadata.items[0].description
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
  for (let i = 0; i < pathArray.length; i++) {
    const segment = pathArray[i];

    if (!current || typeof current !== "object") {
      return undefined;
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
      current = (current as Record<string, unknown>)[segment];
    }

    // Check if we found metadata at this level
    if (isExtractedFieldMetadata(current)) {
      return current;
    }
  }

  return undefined;
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

  // All fields are optional except citation
  if (!("citation" in obj) || !Array.isArray(obj.citation)) {
    return false;
  }

  // Check optional fields if they exist
  if ("confidence" in obj && typeof obj.confidence !== "number") {
    return false;
  }

  if ("reasoning" in obj && typeof obj.reasoning !== "string") {
    return false;
  }

  if (
    "extraction_confidence" in obj &&
    typeof obj.extraction_confidence !== "number"
  ) {
    return false;
  }

  return true;
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
