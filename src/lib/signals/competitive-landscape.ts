/**
 * Competitive Landscape Intelligence
 * Competitor positioning and impression share data for strategic ad decisions.
 * Based on Google Ads auction insights and market intelligence.
 */

import { Signal, signalId, expiresIn } from "./types";

// ── Competitive baselines from Google Ads auction insights ───────────

const COMPETITIVE_BASELINES = {
  ajio_luxe: {
    name: "Ajio Luxe",
    impression_share: 0.1398,
  },
  myntra: {
    name: "Myntra",
    impression_share: 0.1255,
    position_above: 0.4502,   // Shows above Ajio Luxe 45% of the time
  },
  amazon: {
    name: "Amazon Fashion",
    impression_share: 0.1182,
    position_above: 0.3955,   // Shows above Ajio Luxe 39.5% of the time
  },
  tatacliq: {
    name: "Tata CLiQ Luxury",
    impression_share: 0.0876,
    position_above: 0.4847,   // Closest threat — above 48.47% of the time
  },
};

const ARBITRAGE_OPPORTUNITIES = {
  farfetch: {
    name: "Farfetch",
    issue: "Cannot deliver to India",
    conquest_cvr: 0.70,       // 70%+ conversion when conquesting their searches
  },
  aspirational_brands: {
    brands: ["Gucci", "Louis Vuitton", "Prada", "Dior", "Balenciaga"],
    issue: "Indian searches with no Ajio inventory",
    opportunity: "Redirect to comparable available brands",
  },
};

export async function getCompetitiveLandscapeSignals(): Promise<Signal[]> {
  try {
    const now = new Date();
    const signals: Signal[] = [];

    // ── 1. TataCLiQ position above threat ────────────────────────────
    signals.push({
      id: signalId("competitive-landscape", "tatacliq-position-above"),
      type: "competitor",
      source: "Google Ads Auction Insights",
      title: "TataCLiQ Position Above Threat 48.47%",
      description: `Tata CLiQ Luxury appears above Ajio Luxe 48.47% of the time despite having only 8.76% impression share (vs our 13.98%). They're winning on ad rank/quality score, not budget. This is the closest competitive threat.`,
      location: "Pan India",
      severity: "critical",
      confidence: 0.92,
      triggersWhat: "Bid strategy adjustment on luxury keywords where TataCLiQ competes",
      targetArchetypes: ["Fashion Loyalist", "Price-Conscious Luxury"],
      suggestedBrands: ["Hugo Boss", "Coach", "Jimmy Choo", "Michael Kors"],
      suggestedAction: "Increase bids on shared keywords where TataCLiQ has position advantage. Improve ad relevance scores. Target their weak hours (late night, early morning).",
      data: {
        ajio_impression_share: COMPETITIVE_BASELINES.ajio_luxe.impression_share,
        tatacliq_impression_share: COMPETITIVE_BASELINES.tatacliq.impression_share,
        tatacliq_position_above: COMPETITIVE_BASELINES.tatacliq.position_above,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 2. Myntra impression share proximity ─────────────────────────
    signals.push({
      id: signalId("competitive-landscape", "myntra-impression-share"),
      type: "competitor",
      source: "Google Ads Auction Insights",
      title: "Myntra Close Behind: 12.55% vs Our 13.98%",
      description: `Myntra holds 12.55% impression share vs our 13.98% — only 1.43pp gap. They show above us 45.02% of the time. Risk of losing impression share leadership.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.90,
      triggersWhat: "Defensive bidding on luxury fashion keywords",
      targetArchetypes: ["Fashion Loyalist", "Aspiring Premium"],
      suggestedBrands: ["All brands on Ajio Luxe"],
      suggestedAction: "Maintain bid pressure on core luxury keywords. Differentiate with 'authentic luxury' messaging — Myntra is mass-market perception.",
      data: {
        ajio_impression_share: COMPETITIVE_BASELINES.ajio_luxe.impression_share,
        myntra_impression_share: COMPETITIVE_BASELINES.myntra.impression_share,
        myntra_position_above: COMPETITIVE_BASELINES.myntra.position_above,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 3. Amazon fashion positioning ────────────────────────────────
    signals.push({
      id: signalId("competitive-landscape", "amazon-fashion-position"),
      type: "competitor",
      source: "Google Ads Auction Insights",
      title: "Amazon Fashion: 11.82% Share, Above 39.55%",
      description: `Amazon Fashion holds 11.82% impression share and appears above Ajio Luxe 39.55% of the time. They compete on convenience, not luxury positioning. Differentiation is key.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.88,
      triggersWhat: "Positioning strategy vs Amazon on luxury searches",
      targetArchetypes: ["Fashion Loyalist", "Luxury Connoisseur"],
      suggestedBrands: ["All premium brands"],
      suggestedAction: "Don't compete with Amazon on price or convenience. Emphasize curation, authenticity, and luxury experience. Run 'genuine luxury, not marketplace' angle.",
      data: {
        amazon_impression_share: COMPETITIVE_BASELINES.amazon.impression_share,
        amazon_position_above: COMPETITIVE_BASELINES.amazon.position_above,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 4. Farfetch arbitrage ────────────────────────────────────────
    signals.push({
      id: signalId("competitive-landscape", "farfetch-arbitrage"),
      type: "competitor",
      source: "Competitive Intelligence",
      title: "Farfetch Arbitrage Active",
      description: `Farfetch cannot deliver to India but Indian users still search for them. Conquest conversion rate is 70%+. Bid on 'farfetch india', 'buy farfetch in india', and brand+farfetch keywords.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.85,
      triggersWhat: "Farfetch conquest campaigns on Google Ads",
      targetArchetypes: ["Luxury Connoisseur", "Fashion Loyalist"],
      suggestedBrands: ["Versace", "Kenzo", "Max Mara", "Jimmy Choo"],
      suggestedAction: "Run Google Ads targeting 'farfetch india delivery', 'buy [brand] farfetch india'. Landing page: 'Same brands, ships in India, no customs wait'.",
      data: {
        farfetch_issue: ARBITRAGE_OPPORTUNITIES.farfetch.issue,
        conquest_cvr: ARBITRAGE_OPPORTUNITIES.farfetch.conquest_cvr,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 5. Aspirational brand gap ────────────────────────────────────
    signals.push({
      id: signalId("competitive-landscape", "aspirational-brand-gap"),
      type: "competitor",
      source: "Competitive Intelligence",
      title: "Aspirational Brand Search Gap",
      description: `Indian users search for Gucci, Louis Vuitton, Prada, Dior, Balenciaga but Ajio Luxe doesn't carry them. Redirect this intent to comparable brands available on the platform.`,
      location: "Pan India",
      severity: "medium",
      confidence: 0.80,
      triggersWhat: "Aspirational brand redirect campaigns",
      targetArchetypes: ["Aspiring Premium", "Luxury Connoisseur"],
      suggestedBrands: ["Hugo Boss", "Coach", "Versace", "Jimmy Choo"],
      suggestedAction: "Create campaigns targeting 'gucci bags india alternative', 'louis vuitton style india'. Redirect to comparable Ajio Luxe brands with 'same luxury DNA' messaging.",
      data: {
        aspirational_brands: ARBITRAGE_OPPORTUNITIES.aspirational_brands.brands,
        opportunity: ARBITRAGE_OPPORTUNITIES.aspirational_brands.opportunity,
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    // ── 6. Indian designer moat ──────────────────────────────────────
    signals.push({
      id: signalId("competitive-landscape", "indian-designer-moat"),
      type: "competitor",
      source: "Competitive Intelligence",
      title: "Indian Designer Moat: Zero Competition",
      description: `For Indian luxury designers (Sabyasachi-adjacent, Manish Malhotra tier), Ajio Luxe faces zero competition from Myntra, Amazon, or international platforms. This is an uncontested category moat.`,
      location: "Pan India",
      severity: "high",
      confidence: 0.88,
      triggersWhat: "Indian designer exclusive campaigns",
      targetArchetypes: ["Fashion Loyalist", "Wedding Shopper", "Luxury Connoisseur"],
      suggestedBrands: ["Indian designer brands on Ajio Luxe"],
      suggestedAction: "Invest heavily in Indian designer brand campaigns. No competitor can match this selection. Use 'only on Ajio Luxe' exclusivity messaging.",
      data: {
        competition_level: "zero",
        moat_type: "exclusive_inventory",
        category: "Indian luxury designers",
      },
      detectedAt: now,
      expiresAt: expiresIn(24),
    });

    return signals;
  } catch (error) {
    console.error("[competitive-landscape] Error generating signals:", error);
    return [];
  }
}
