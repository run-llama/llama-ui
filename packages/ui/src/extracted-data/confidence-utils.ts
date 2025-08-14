import { isLowConfidence } from "@/lib";

export function getConfidenceBackgroundClass(confidence?: number): string {
  if (!confidence || confidence === 0) return "";

  // Only show orange background for low confidence (<90%)
  // High confidence (>=90%) gets normal background
  return isLowConfidence(confidence) ? "bg-orange-50" : "";
}
