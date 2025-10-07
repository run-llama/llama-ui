import { PrimitiveValue } from "./types";

/**
 * Primitive field types for validation and UI rendering
 */
export enum PrimitiveType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
}

/**
 * Convert JSON Schema type string to PrimitiveType enum
 */
export function toPrimitiveType(schemaType: string): PrimitiveType {
  switch (schemaType) {
    case "number":
      return PrimitiveType.NUMBER;
    case "boolean":
      return PrimitiveType.BOOLEAN;
    case "string":
    default:
      return PrimitiveType.STRING;
  }
}

/**
 * Convert input value to the correct type - simplified without validation errors
 */
export function convertPrimitiveValue(
  inputValue: string,
  expectedType: PrimitiveType,
  required = false
): PrimitiveValue {
  switch (expectedType) {
    case PrimitiveType.STRING:
      // Empty string is valid for strings
      return inputValue;

    case PrimitiveType.NUMBER:
      // Empty string means user cleared the number input
      if (inputValue === "") {
        // If required, should not allow null - return the original empty string
        // so the UI can handle the validation feedback
        return required ? "" : null;
      }
      // Browser input[type="number"] ensures this is already a valid number
      return Number(inputValue);

    case PrimitiveType.BOOLEAN:
      // Select dropdown ensures this is "true" or "false"
      return inputValue === "true";

    default:
      return inputValue;
  }
}

/**
 * Get default value for primitive types based on whether the field is required
 */
export function getDefaultPrimitiveValue(
  primitiveType: PrimitiveType,
  isRequired: boolean
): unknown {
  if (!isRequired) {
    // For optional fields, return empty string (will be shown as blank)
    return "";
  }

  // For required fields, provide meaningful defaults
  switch (primitiveType) {
    case PrimitiveType.STRING:
      return ""; // Still empty to encourage user input
    case PrimitiveType.NUMBER:
      return 0;
    case PrimitiveType.BOOLEAN:
      return false;
    default:
      return "";
  }
}

/**
 * Infer PrimitiveType from a runtime value
 * This is used as a fallback when schema metadata is not available
 */
export function inferTypeFromValue(value: unknown): PrimitiveType {
  if (value === null || value === undefined) {
    return PrimitiveType.STRING;
  }

  const valueType = typeof value;
  
  switch (valueType) {
    case "boolean":
      return PrimitiveType.BOOLEAN;
    case "number":
      return PrimitiveType.NUMBER;
    case "string":
    default:
      return PrimitiveType.STRING;
  }
}
