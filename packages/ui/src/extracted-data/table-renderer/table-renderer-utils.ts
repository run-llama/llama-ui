import type { FieldSchemaMetadata } from "../schema-reconciliation";
import { getDefaultValueForType } from "../schema-metadata-lookup";

export interface ColumnDef {
  key: string;
  header: string;
  path: string[];
  isLeaf: boolean;
}

export const formatFieldName = (key: string): string => {
  // Replace underscores with spaces, then insert spaces before capital letters that are not preceded by another capital letter
  // This preserves all-uppercase words like 'API'
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

// Utility function to check if a table cell has been changed
export function isTableCellChanged(
  changedPaths: Set<string> | undefined,
  keyPath: string[],
  rowIndex: number,
  columnKey: string
): boolean {
  if (!changedPaths) return false;

  // Try both relative path (for table-renderer tests) and absolute path (for ExtractedDataDisplay)
  const relativeCellPath = `${rowIndex}.${columnKey}`;
  const absoluteCellPath = [...keyPath, String(rowIndex), columnKey].join(".");

  return (
    changedPaths.has(relativeCellPath) || changedPaths.has(absoluteCellPath)
  );
}

// Recursively flatten nested objects to get all leaf paths
export function flattenObject(
  obj: Record<string, unknown>,
  prefix: string[] = []
): ColumnDef[] {
  const columns: ColumnDef[] = [];

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const currentPath = [...prefix, key];

    if (
      value !== null &&
      value !== undefined &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      // Recursively process nested object
      const nestedColumns = flattenObject(
        value as Record<string, unknown>,
        currentPath
      );
      columns.push(...nestedColumns);
    } else if (Array.isArray(value)) {
      // Arrays are treated as leaf columns to allow nested renderers in table cells
      columns.push({
        key: currentPath.join("."),
        header: formatFieldName(key),
        path: currentPath,
        isLeaf: true,
      });
    } else if (value !== null && value !== undefined) {
      // Leaf node - create column (only for non-null, non-undefined, non-array values)
      columns.push({
        key: currentPath.join("."),
        header: formatFieldName(key),
        path: currentPath,
        isLeaf: true,
      });
    }
    // Skip null, undefined, and arrays
  });

  return columns;
}

export const getValue = (
  item: Record<string, unknown>,
  column: ColumnDef
): unknown => {
  let current: unknown = item;
  for (const key of column.path) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
};

export const handleUpdate = (
  rowIndex: number,
  column: ColumnDef,
  value: unknown,
  data: Record<string, unknown>[],
  onUpdate: (
    index: number,
    key: string,
    value: unknown,
    affectedPaths?: string[]
  ) => void
) => {
  if (column.path.length === 1) {
    // Simple field - return the specific path that was changed
    const affectedPath = `${rowIndex}.${column.path[0]}`;
    onUpdate(rowIndex, column.path[0], value, [affectedPath]);
  } else {
    // Nested field - need to update the root object
    const rootKey = column.path[0];
    const currentRootObj = data[rowIndex][rootKey] || {};

    // Deep clone and update
    const updatedObj = JSON.parse(JSON.stringify(currentRootObj));
    let current = updatedObj;

    // Navigate to the parent of the target field
    for (let i = 1; i < column.path.length - 1; i++) {
      const key = column.path[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    // Set the final value
    const finalKey = column.path[column.path.length - 1];
    current[finalKey] = value;

    // Return the specific nested path that was changed
    const affectedPath = `${rowIndex}.${column.key}`;
    onUpdate(rowIndex, rootKey, updatedObj, [affectedPath]);
  }
};

/**
 * Get default object for a new table row based on field metadata
 */
export function getTableRowDefaultValue(
  keyPath: string[],
  fieldMetadata: Record<string, FieldSchemaMetadata>
): Record<string, unknown> {
  const newRow: Record<string, unknown> = {};

  // Look for metadata for fields within this array's object items
  // The array path + index + field pattern: e.g., "items.0.name", "items.0.price"
  const arrayPath = keyPath.join(".");

  // Find all field metadata that belongs to this array's object structure
  Object.entries(fieldMetadata).forEach(([path, metadata]) => {
    const pathParts = path.split(".");

    // Check if this field belongs to our array's object items
    // Pattern: arrayPath.index.fieldPath (e.g., "items.0.name" where arrayPath is "items")
    if (pathParts.length > keyPath.length + 1) {
      const pathArrayPart = pathParts.slice(0, keyPath.length).join(".");

      if (pathArrayPart === arrayPath) {
        // This field belongs to our array's object structure
        // Extract the field path within the object (after arrayPath.index)
        const fieldPath = pathParts.slice(keyPath.length + 1); // Skip arrayPath and index

        // Get default value based on field schema type
        const defaultValue = getFieldDefaultValue(metadata);

        // Set the nested value in the new row object
        setNestedValue(newRow, fieldPath, defaultValue);
      }
    }
  });

  return newRow;
}

/**
 * Helper function to get default value for a field based on its metadata
 */
function getFieldDefaultValue(metadata: FieldSchemaMetadata): unknown {
  if (!metadata || !metadata.schemaType) {
    return "";
  }

  // Handle complex types that aren't in the shared utility
  switch (metadata.schemaType) {
    case "array":
      return []; // Empty array for array fields
    case "object":
      return {}; // Empty object for nested objects
    default:
      // Use shared default value generation for primitive types
      return getDefaultValueForType(metadata.schemaType);
  }
}

/**
 * Helper function to set nested value in an object
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown
): void {
  if (path.length === 1) {
    obj[path[0]] = value;
  } else {
    if (!obj[path[0]] || typeof obj[path[0]] !== "object") {
      obj[path[0]] = {};
    }
    setNestedValue(
      obj[path[0]] as Record<string, unknown>,
      path.slice(1),
      value
    );
  }
}
