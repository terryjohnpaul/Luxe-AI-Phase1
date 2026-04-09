/**
 * Google Analytics 4 Data API Integration
 *
 * Handles: Website analytics, attribution, revenue by source/city
 * Auth: OAuth2 / Service Account
 * Endpoint: analyticsdata.googleapis.com/v1beta
 */

interface GA4ReportRow {
  dimensions: string[];
  metrics: number[];
}

interface GA4Report {
  rows: GA4ReportRow[];
  dimensionHeaders: string[];
  metricHeaders: string[];
  rowCount: number;
}

export class GA4Client {
  private propertyId: string;
  private accessToken: string;

  constructor(config: { propertyId: string; accessToken: string }) {
    this.propertyId = config.propertyId;
    this.accessToken = config.accessToken;
  }

  private async runReport(body: any): Promise<GA4Report> {
    const resp = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(`GA4 API error: ${JSON.stringify(error)}`);
    }

    const data = await resp.json();

    return {
      rows: (data.rows || []).map((row: any) => ({
        dimensions: row.dimensionValues?.map((d: any) => d.value) || [],
        metrics: row.metricValues?.map((m: any) => parseFloat(m.value)) || [],
      })),
      dimensionHeaders: data.dimensionHeaders?.map((h: any) => h.name) || [],
      metricHeaders: data.metricHeaders?.map((h: any) => h.name) || [],
      rowCount: data.rowCount || 0,
    };
  }

  // Revenue by source/medium
  async getRevenueBySource(startDate = "7daysAgo", endDate = "today") {
    return this.runReport({
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [
        { name: "totalRevenue" },
        { name: "sessions" },
        { name: "conversions" },
        { name: "activeUsers" },
      ],
      dateRanges: [{ startDate, endDate }],
      orderBys: [{ metric: { metricName: "totalRevenue" }, desc: true }],
      limit: 50,
    });
  }

  // Revenue by city (for geo intelligence)
  async getRevenueByCity(startDate = "7daysAgo", endDate = "today") {
    return this.runReport({
      dimensions: [{ name: "city" }],
      metrics: [
        { name: "totalRevenue" },
        { name: "sessions" },
        { name: "conversions" },
        { name: "activeUsers" },
        { name: "averageSessionDuration" },
      ],
      dateRanges: [{ startDate, endDate }],
      orderBys: [{ metric: { metricName: "totalRevenue" }, desc: true }],
      limit: 50,
    });
  }

  // Daily revenue trend
  async getDailyRevenue(startDate = "30daysAgo", endDate = "today") {
    return this.runReport({
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "totalRevenue" },
        { name: "sessions" },
        { name: "conversions" },
        { name: "activeUsers" },
      ],
      dateRanges: [{ startDate, endDate }],
      orderBys: [{ dimension: { dimensionName: "date", orderType: "ALPHANUMERIC" } }],
    });
  }

  // Device breakdown
  async getDeviceBreakdown(startDate = "7daysAgo", endDate = "today") {
    return this.runReport({
      dimensions: [{ name: "deviceCategory" }],
      metrics: [
        { name: "totalRevenue" },
        { name: "sessions" },
        { name: "conversions" },
        { name: "bounceRate" },
      ],
      dateRanges: [{ startDate, endDate }],
    });
  }

  // Top landing pages
  async getTopLandingPages(startDate = "7daysAgo", endDate = "today") {
    return this.runReport({
      dimensions: [{ name: "landingPage" }],
      metrics: [
        { name: "sessions" },
        { name: "conversions" },
        { name: "totalRevenue" },
        { name: "bounceRate" },
      ],
      dateRanges: [{ startDate, endDate }],
      orderBys: [{ metric: { metricName: "totalRevenue" }, desc: true }],
      limit: 20,
    });
  }

  // E-commerce product performance
  async getProductPerformance(startDate = "7daysAgo", endDate = "today") {
    return this.runReport({
      dimensions: [{ name: "itemName" }, { name: "itemBrand" }],
      metrics: [
        { name: "itemRevenue" },
        { name: "itemsPurchased" },
        { name: "itemsViewed" },
      ],
      dateRanges: [{ startDate, endDate }],
      orderBys: [{ metric: { metricName: "itemRevenue" }, desc: true }],
      limit: 50,
    });
  }
}
