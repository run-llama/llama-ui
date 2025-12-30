/**
 * Get the default workflow server URL.
 *
 * Uses window.location.origin when available (browser environment),
 * falls back to localhost:8000 for SSR or non-browser environments.
 */
export function getDefaultWorkflowUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:8000";
}
