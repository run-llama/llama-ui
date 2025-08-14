import type {
  ExtractedFieldMetadataDict,
  ExtractedFieldMetadata,
} from "llama-cloud-services/beta/agent";

/**
 * Find metadata for a specific field path in the metadata object
 * Supports nested paths like "merchant.address.street" and array indices like "items.0.description"
 *
 * @param path - The field path as a string (e.g., "merchant.name") or array of path segments
 * @param metadata - The metadata object, which can have nested structure
 * @returns The metadata for the field, or undefined if not found
 */
export function findExtractedFieldMetadata(
  path: string | string[],
  metadata: ExtractedFieldMetadataDict
): ExtractedFieldMetadata | undefined {
  // Convert string path to array
  const pathArray = Array.isArray(path) ? path : path.split(".");

  // Try direct lookup first (for flattened metadata)
  const directPath = pathArray.join(".");
  const directResult = metadata[directPath];
  if (isExtractedFieldMetadata(directResult)) {
    return directResult;
  }

  // Try nested lookup
  let current: unknown = metadata;

  for (let i = 0; i < pathArray.length; i++) {
    const segment = pathArray[i];

    if (!current || typeof current !== "object") {
      return undefined;
    }

    // Handle array index in the path
    if (!isNaN(Number(segment))) {
      // This is an array index, but metadata structure might use different notation
      // Try looking for array-specific metadata patterns
      const arrayMetadataKey = pathArray.slice(0, i + 1).join(".");
      const arrayMetadata = metadata[arrayMetadataKey];
      if (isExtractedFieldMetadata(arrayMetadata)) {
        return arrayMetadata;
      }
    }

    // Continue traversing
    current = (current as Record<string, unknown>)[segment];
  }

  // Check if the final result is valid metadata
  if (isExtractedFieldMetadata(current)) {
    return current;
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
