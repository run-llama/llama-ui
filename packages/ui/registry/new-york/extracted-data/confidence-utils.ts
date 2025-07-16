import { isLowConfidence } from "@/lib";

export function getConfidenceBackgroundClass(confidence?: number): string {
  if (!confidence || confidence === 0) return "";

  // Only show orange background for low confidence (<90%)
  // High confidence (>=90%) gets normal background
  return isLowConfidence(confidence) ? "bg-orange-50" : "";
}

/**
 * Utility function to flatten nested confidence object into keypath: value format
 * Converts nested confidence structure like { merchant: { name: 0.95 } }
 * to flat structure like { "merchant.name": 0.95 }
 */
export function flattenConfidence(
  confidence: Record<string, unknown>,
  prefix: string = "",
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [key, value] of Object.entries(confidence)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "number") {
      result[currentPath] = value;
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayPath = `${currentPath}.${index}`;
        if (typeof item === "number") {
          result[arrayPath] = item;
        } else if (typeof item === "object" && item !== null) {
          Object.assign(
            result,
            flattenConfidence(item as Record<string, unknown>, arrayPath),
          );
        }
      });
    } else if (typeof value === "object" && value !== null) {
      Object.assign(
        result,
        flattenConfidence(value as Record<string, unknown>, currentPath),
      );
    }
  }

  return result;
}
