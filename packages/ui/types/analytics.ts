/**
 * Analytics-related props that can be added to components for tracking purposes.
 * This interface is designed to be extensible for future analytics needs.
 */
export interface AnalyticsProps {
  /**
   * Component identifier for analytics tracking.
   * Used to identify specific UI elements in analytics events.
   */
  "da-cid"?: string;
}
