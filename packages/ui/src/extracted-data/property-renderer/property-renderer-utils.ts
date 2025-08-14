import type { ExtractedFieldMetadataDict } from "llama-cloud-services/beta/agent";

export const formatFieldName = (key: string): string => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const isPropertyChanged = (
  changedPaths: Set<string> | undefined,
  keyPath: string[]
): boolean => {
  if (!changedPaths) return false;
  const pathString = keyPath.join(".");
  return changedPaths.has(pathString);
};

// New function to filter metadata for arrays
export const filterMetadataForArray = (
  metadata: ExtractedFieldMetadataDict | undefined,
  keyPath: string[]
): ExtractedFieldMetadataDict => {
  const arrayMetadata: ExtractedFieldMetadataDict = {};

  if (!metadata || typeof metadata !== "object") {
    return arrayMetadata;
  }

  // If keyPath is empty, return all metadata
  if (keyPath.length === 0) {
    return { ...metadata };
  }

  const currentPath = keyPath.join(".");

  Object.entries(metadata).forEach(([path, meta]) => {
    if (path.startsWith(currentPath + ".")) {
      // Convert "items.0.description" to "0.description" or "tags.0" to "0"
      const relativePath = path.substring(currentPath.length + 1);
      arrayMetadata[relativePath] = meta;
    }
  });

  return arrayMetadata;
};

export const isArrayOfObjects = (value: unknown[]): boolean => {
  return (
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    !Array.isArray(value[0])
  );
};

export const shouldShowKeyOnSeparateLine = (value: unknown): boolean => {
  return (
    (Array.isArray(value) && isArrayOfObjects(value)) ||
    (typeof value === "object" && value !== null && !Array.isArray(value))
  );
};
