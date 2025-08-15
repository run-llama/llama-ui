export function getConfidenceBackgroundClass(
  threshold: number,
  confidence?: number
): string {
  if (!confidence || confidence === 0) return "";

  return confidence < threshold ? "bg-orange-50" : "";
}

export function getConfidenceBorderClass(
  threshold: number,
  confidence?: number
): string {
  if (!confidence || confidence === 0) return "";

  return confidence < threshold
    ? "border-b-2 border-orange-300"
    : "border-b border-gray-200";
}
