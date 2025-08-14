import { FieldSchemaMetadata } from "./schema-reconciliation";
import { findFieldSchemaMetadata } from "./metadata-path-utils";

/**
 * Convert snake_case or camelCase field names to Title Case
 */
export function formatFieldName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Field display information for UI rendering
 */
export interface FieldDisplayInfo {
  /** Formatted field name for display */
  name: string;
  /** Whether this field is required by schema */
  isRequired: boolean;
  /** Whether this field was missing from original data */
  wasMissing: boolean;
  /** Whether this field has validation errors */
  hasError: boolean;
  /** Validation error message if any */
  errorMessage?: string;
}

/**
 * Get field display information including requirement status and formatting
 */
export function getFieldDisplayInfo(
  key: string,
  fieldSchemaMetadata: Record<string, FieldSchemaMetadata>,
  validationErrors: Array<{ path: string[]; message: string }> = [],
  keyPath: string[] = [key]
): FieldDisplayInfo {
  const pathString = keyPath.join(".");
  const metadata = findFieldSchemaMetadata(keyPath, fieldSchemaMetadata);

  // Use title from schema metadata, fallback to formatted field name
  const displayName = metadata?.title || formatFieldName(key);

  // Find validation error for this field
  const fieldError = validationErrors.find(
    (error) => error.path.join(".") === pathString
  );

  return {
    name: displayName,
    isRequired: metadata?.isRequired ?? false,
    wasMissing: metadata?.wasMissing ?? false,
    hasError: !!fieldError,
    errorMessage: fieldError?.message,
  };
}

/**
 * Generate CSS classes for field labels based on their status
 */
export function getFieldLabelClasses(fieldInfo: FieldDisplayInfo): string {
  const baseClasses =
    "text-sm font-medium text-zinc-900 min-w-0 flex-shrink-0 min-h-8 flex items-center";

  if (fieldInfo.hasError) {
    return `${baseClasses} text-red-600`;
  }

  if (fieldInfo.isRequired) {
    return `${baseClasses} font-semibold`;
  }

  return baseClasses;
}

/**
 * Generate the display text for field labels, including requirement indicators
 */
export function getFieldLabelText(
  fieldInfo: FieldDisplayInfo
): React.ReactNode {
  const { name, isRequired } = fieldInfo;

  // Add required indicator
  if (isRequired) {
    return (
      <>
        {name} <span className="text-red-500 relative top-0.5">&nbsp;*</span>
      </>
    );
  }

  return name;
}
