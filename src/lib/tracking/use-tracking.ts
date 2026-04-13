"use client";

import { useCallback, useRef } from "react";
import { getTracker } from "./event-tracker";

export function useTracking() {
  const expandTimers = useRef<Record<string, number>>({});

  const trackView = useCallback((recId: string, position?: number) => {
    getTracker().track({ event: "recommendation_viewed", recommendationId: recId, position });
  }, []);

  const trackExpand = useCallback((recId: string) => {
    expandTimers.current[recId] = Date.now();
    getTracker().track({ event: "recommendation_expanded", recommendationId: recId });
  }, []);

  const trackCollapse = useCallback((recId: string) => {
    const start = expandTimers.current[recId];
    const dwellTimeMs = start ? Date.now() - start : undefined;
    delete expandTimers.current[recId];
    getTracker().track({ event: "recommendation_collapsed", recommendationId: recId, dwellTimeMs });
  }, []);

  const trackEditStart = useCallback((recId: string) => {
    getTracker().track({ event: "edit_started", recommendationId: recId });
  }, []);

  const trackEditSave = useCallback((recId: string, editPayload: Record<string, unknown>) => {
    getTracker().track({ event: "edit_saved", recommendationId: recId, editPayload });
  }, []);

  const trackApprove = useCallback((recId: string, wasEdited: boolean) => {
    getTracker().track({ event: "recommendation_approved", recommendationId: recId, wasEdited });
  }, []);

  const trackSkip = useCallback((recId: string) => {
    getTracker().track({ event: "recommendation_skipped", recommendationId: recId });
  }, []);

  const trackCopy = useCallback((recId: string, field: string) => {
    getTracker().track({ event: "text_copied", recommendationId: recId, field });
  }, []);

  const trackGuideOpen = useCallback((recId: string) => {
    getTracker().track({ event: "guide_opened", recommendationId: recId });
  }, []);

  return {
    trackView,
    trackExpand,
    trackCollapse,
    trackEditStart,
    trackEditSave,
    trackApprove,
    trackSkip,
    trackCopy,
    trackGuideOpen,
  };
}
