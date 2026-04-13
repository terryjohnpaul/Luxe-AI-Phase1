export type TrackingEvent =
  | { event: "recommendation_viewed"; recommendationId: string; position?: number }
  | { event: "recommendation_expanded"; recommendationId: string }
  | { event: "recommendation_collapsed"; recommendationId: string; dwellTimeMs?: number }
  | { event: "edit_started"; recommendationId: string }
  | { event: "edit_saved"; recommendationId: string; editPayload: Record<string, unknown> }
  | { event: "recommendation_approved"; recommendationId: string; wasEdited: boolean }
  | { event: "recommendation_skipped"; recommendationId: string }
  | { event: "text_copied"; recommendationId: string; field: string }
  | { event: "guide_opened"; recommendationId: string }
  | { event: "guide_closed"; recommendationId: string };

export interface TrackingPayload {
  events: Array<TrackingEvent & { timestamp: number; sessionId: string }>;
}
