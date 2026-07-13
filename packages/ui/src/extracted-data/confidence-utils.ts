export function getConfidenceBackgroundClass(
  threshold: number,
  confidence?: number
): string {
  if (!confidence || confidence === 0) return "";

  return confidence < threshold ? "bg-warning-muted" : "";
}

export function getConfidenceBorderClass(
  threshold: number,
  confidence?: number
): string {
  if (!confidence || confidence === 0) return "";

  return confidence < threshold
    ? "border-b-2 border-warning"
    : "border-b border-border";
}
