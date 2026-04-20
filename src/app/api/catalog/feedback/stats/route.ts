import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

// ============================================================
// FEEDBACK STATS
// ============================================================

interface FeedbackEntry {
  recId: string;
  productId: string;
  action: "approve" | "skip" | "remove" | "add_manual";
  reason?: string;
  timestamp: string;
}

interface FeedbackData {
  feedback: FeedbackEntry[];
}

const FEEDBACK_FILE = path.join(process.cwd(), "data", "product-feedback.json");

function loadFeedback(): FeedbackData {
  if (!existsSync(FEEDBACK_FILE)) {
    return { feedback: [] };
  }
  try {
    const raw = readFileSync(FEEDBACK_FILE, "utf-8");
    return JSON.parse(raw) as FeedbackData;
  } catch {
    return { feedback: [] };
  }
}

export async function GET() {
  try {
    const data = loadFeedback();
    const entries = data.feedback;

    // Total counts by action
    const totalApprovals = entries.filter(e => e.action === "approve").length;
    const totalSkips = entries.filter(e => e.action === "skip").length;
    const totalRemoves = entries.filter(e => e.action === "remove").length;
    const totalManualAdds = entries.filter(e => e.action === "add_manual").length;

    // Skips by product
    const skipsByProduct: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.action === "skip" || entry.action === "remove") {
        skipsByProduct[entry.productId] = (skipsByProduct[entry.productId] || 0) + 1;
      }
    }

    // Skips by brand (requires product ID to brand mapping — we extract from feedback context)
    // Since we don't load catalog here, we track by productId prefix patterns
    const skipsByBrand: Record<string, number> = {};
    const approvalsByBrand: Record<string, number> = {};

    // Try loading catalog for brand mapping
    try {
      const catalogPath = path.join(process.cwd(), "data", "catalog-products.json");
      if (existsSync(catalogPath)) {
        const raw = readFileSync(catalogPath, "utf-8");
        const catalog = JSON.parse(raw);
        const brandMap: Record<string, string> = {};
        for (const p of catalog.products || []) {
          brandMap[p.id] = p.brand;
        }

        for (const entry of entries) {
          const brand = brandMap[entry.productId] || "unknown";
          if (entry.action === "skip" || entry.action === "remove") {
            skipsByBrand[brand] = (skipsByBrand[brand] || 0) + 1;
          }
          if (entry.action === "approve") {
            approvalsByBrand[brand] = (approvalsByBrand[brand] || 0) + 1;
          }
        }
      }
    } catch {
      // Catalog not available, skip brand breakdown
    }

    // Sort skips by product descending
    const topSkippedProducts = Object.entries(skipsByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([productId, count]) => ({ productId, count }));

    // Sort skips by brand descending
    const topSkippedBrands = Object.entries(skipsByBrand)
      .sort(([, a], [, b]) => b - a)
      .map(([brand, count]) => ({ brand, count }));

    // Sort approvals by brand descending
    const topApprovedBrands = Object.entries(approvalsByBrand)
      .sort(([, a], [, b]) => b - a)
      .map(([brand, count]) => ({ brand, count }));

    return NextResponse.json({
      totalFeedback: entries.length,
      actionCounts: {
        approvals: totalApprovals,
        skips: totalSkips,
        removes: totalRemoves,
        manualAdds: totalManualAdds,
      },
      approvalRate: entries.length > 0
        ? Math.round((totalApprovals / entries.length) * 100) + "%"
        : "N/A",
      topSkippedProducts,
      topSkippedBrands,
      topApprovedBrands,
    });
  } catch (error) {
    console.error("Feedback stats error:", error);
    return NextResponse.json(
      { error: "Failed to compute feedback stats", details: String(error) },
      { status: 500 }
    );
  }
}
