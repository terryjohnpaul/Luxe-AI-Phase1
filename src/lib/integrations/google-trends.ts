/**
 * Google Trends Integration
 *
 * Handles: Brand keyword spike detection
 * Auth: None (unofficial library, scrapes trends.google.com)
 * Rate limits: ~10-15 requests/minute before blocking
 * Fallback: SerpApi ($50/month) for reliability
 */

import googleTrends from "google-trends-api";

interface TrendResult {
  keyword: string;
  currentInterest: number; // 0-100
  baselineInterest: number; // 0-100 average
  spikeRatio: number; // current / baseline
  isSpiking: boolean; // > 2x baseline
  dataPoints: Array<{ time: string; value: number }>;
}

// Brands to monitor (expandable)
const DEFAULT_TRACKED_BRANDS = [
  "Ami Paris",
  "Hugo Boss",
  "Diesel",
  "Kenzo",
  "All Saints",
  "Cult Gaia",
  "Farm Rio",
  "Acne Studios",
  "Maison Kitsune",
  "Self Portrait",
  "Jacquemus",
  "Casablanca",
  "Amiri",
  "Polo Ralph Lauren",
  "Michael Kors",
  "Coach",
  "Kate Spade",
  "Paul Smith",
  "Hackett",
  "Moncler",
  "Stella McCartney",
  "Zimmermann",
  "Ted Baker",
  "Swarovski",
  "TUMI",
  "Bottega Veneta",
  "Prada",
  "Versace",
  "Jimmy Choo",
  "Salvatore Ferragamo",
];

export class GoogleTrendsClient {
  private trackedBrands: string[];

  constructor(trackedBrands?: string[]) {
    this.trackedBrands = trackedBrands || DEFAULT_TRACKED_BRANDS;
  }

  async checkBrandTrend(keyword: string): Promise<TrendResult> {
    try {
      const results = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        geo: "IN", // India
      });

      const data = JSON.parse(results);
      const timelineData = data.default?.timelineData || [];

      if (timelineData.length === 0) {
        return {
          keyword,
          currentInterest: 0,
          baselineInterest: 0,
          spikeRatio: 0,
          isSpiking: false,
          dataPoints: [],
        };
      }

      const values = timelineData.map(
        (d: { value: number[] }) => d.value[0]
      );
      const recent = values.slice(-6); // Last 6 data points (~24 hours)
      const baseline = values.slice(0, -6); // Earlier period

      const avgBaseline =
        baseline.length > 0
          ? baseline.reduce((a: number, b: number) => a + b, 0) /
            baseline.length
          : 1;
      const avgRecent =
        recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
      const spikeRatio = avgBaseline > 0 ? avgRecent / avgBaseline : 0;

      return {
        keyword,
        currentInterest: avgRecent,
        baselineInterest: avgBaseline,
        spikeRatio: Math.round(spikeRatio * 100) / 100,
        isSpiking: spikeRatio > 2.0, // 2x above baseline = spike
        dataPoints: timelineData.map(
          (d: { formattedTime: string; value: number[] }) => ({
            time: d.formattedTime,
            value: d.value[0],
          })
        ),
      };
    } catch (error) {
      console.error(`Error checking trend for "${keyword}":`, error);
      return {
        keyword,
        currentInterest: 0,
        baselineInterest: 0,
        spikeRatio: 0,
        isSpiking: false,
        dataPoints: [],
      };
    }
  }

  async checkAllBrands(): Promise<TrendResult[]> {
    const results: TrendResult[] = [];

    // Process in batches of 3 with delays to avoid rate limiting
    for (let i = 0; i < this.trackedBrands.length; i += 3) {
      const batch = this.trackedBrands.slice(i, i + 3);
      const batchResults = await Promise.all(
        batch.map((brand) => this.checkBrandTrend(brand))
      );
      results.push(...batchResults);

      // Wait 15 seconds between batches to respect rate limits
      if (i + 3 < this.trackedBrands.length) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }
    }

    return results;
  }

  async getSpikingBrands(): Promise<TrendResult[]> {
    const all = await this.checkAllBrands();
    return all
      .filter((r) => r.isSpiking)
      .sort((a, b) => b.spikeRatio - a.spikeRatio);
  }
}

export { DEFAULT_TRACKED_BRANDS };
export type { TrendResult };
