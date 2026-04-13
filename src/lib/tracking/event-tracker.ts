import type { TrackingEvent, TrackingPayload } from "./types";

const BATCH_SIZE = 8;
const FLUSH_INTERVAL_MS = 10000;

class EventTracker {
  private queue: TrackingPayload["events"] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    if (typeof window !== "undefined") {
      this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  track(event: TrackingEvent) {
    this.queue.push({
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
    if (this.queue.length >= BATCH_SIZE) this.flush();
  }

  private flush() {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/tracking",
          new Blob([JSON.stringify({ events: batch })], { type: "application/json" })
        );
      } else {
        fetch("/api/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: batch }),
          keepalive: true,
        }).catch(() => {
          // Re-queue on failure (capped)
          if (this.queue.length < 50) this.queue.unshift(...batch);
        });
      }
    } catch {
      // Silent fail — tracking should never break the app
    }
  }
}

// Singleton
let tracker: EventTracker | null = null;

export function getTracker(): EventTracker {
  if (!tracker) tracker = new EventTracker();
  return tracker;
}
