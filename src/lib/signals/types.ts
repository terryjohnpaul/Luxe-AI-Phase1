/**
 * Unified Signal Type — every signal source outputs this format
 */

export interface Signal {
  id: string;
  type: SignalCategory;
  source: string;              // API/method that detected this
  title: string;
  description: string;
  location: string;            // "Pan India", "Delhi NCR", "Mumbai", etc.
  severity: "critical" | "high" | "medium" | "low";

  // What this signal means for ads
  triggersWhat: string;        // What products/categories to push
  targetArchetypes: string[];  // Which customer segments
  suggestedBrands: string[];   // Which brands to feature
  suggestedAction: string;     // Specific ad action to take

  // Metadata
  confidence: number;          // 0-1
  expiresAt: Date;             // When this signal becomes stale
  data: Record<string, any>;   // Raw signal data
  detectedAt: Date;
}

export type SignalCategory =
  | "weather"
  | "search_trend"
  | "festival"
  | "salary_cycle"
  | "stock_market"
  | "cricket"
  | "entertainment"
  | "celebrity"
  | "auspicious_day"
  | "exam_results"
  | "competitor"
  | "inventory"
  | "life_event"
  | "economic"
  | "regional"
  | "ott_release"
  | "social_trend"
  | "travel";

export interface SignalSourceConfig {
  name: string;
  enabled: boolean;
  refreshIntervalMs: number;   // How often to check
  apiKey?: string;
}

// Helper to create signal IDs
export function signalId(source: string, key: string): string {
  return `${source}-${key}-${new Date().toISOString().split("T")[0]}`;
}

// Helper to set expiry
export function expiresIn(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
