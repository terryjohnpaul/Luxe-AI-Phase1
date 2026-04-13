/**
 * Economic Sentiment Signals — AUTO-DETECTED
 * Uses free finance APIs for live Sensex/Nifty data.
 * Combines with calendar-based economic events (Budget, appraisal season).
 */

import { Signal, signalId, expiresIn } from "./types";

// Fetch live Nifty 50 data from Yahoo Finance (free, no key needed)
async function fetchNiftyData(): Promise<{ price: number; changePercent: number; isATH: boolean } | null> {
  try {
    const resp = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=5d",
      { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c: any) => c !== null);
    if (validCloses.length < 2) return null;

    const latest = validCloses[validCloses.length - 1];
    const previous = validCloses[validCloses.length - 2];
    const changePercent = ((latest - previous) / previous) * 100;

    // Check 52-week high (rough ATH check)
    const meta = result.meta;
    const fiftyTwoWeekHigh = meta?.fiftyTwoWeekHigh || latest;
    const isATH = latest >= fiftyTwoWeekHigh * 0.98; // Within 2% of 52-week high

    return { price: Math.round(latest), changePercent: Math.round(changePercent * 100) / 100, isATH };
  } catch {
    return null;
  }
}

// Calendar-based economic events
interface EconomicEvent {
  name: string;
  date2026: string;
  impact: "positive" | "negative";
  luxuryEffect: string;
  adStrategy: string;
}

const ECONOMIC_EVENTS_2026: EconomicEvent[] = [
  { name: "Union Budget 2026", date2026: "2026-02-01", impact: "positive", luxuryEffect: "Import duty changes + tax benefits boost disposable income.", adStrategy: "Watch for duty cuts on luxury goods. If salaried class gets tax relief — run 'more to spend' campaigns." },
  { name: "IT Appraisal Season", date2026: "2026-03-15", impact: "positive", luxuryEffect: "10M+ IT professionals get 15-25% raises. Top spending category: wardrobe upgrade.", adStrategy: "Target Bangalore, Hyderabad, Pune, Gurgaon with 'new role, new wardrobe' messaging." },
  { name: "Corporate Bonus Season", date2026: "2026-03-25", impact: "positive", luxuryEffect: "Bonus payouts ₹50K-5L for premium consumers. Disposable income spike.", adStrategy: "Run 'treat yourself' campaigns. Push higher-ticket luxury items." },
  { name: "Tax Refund Season", date2026: "2026-08-01", impact: "positive", luxuryEffect: "ITR refunds credited. Extra ₹20K-1L for professionals.", adStrategy: "Run 'your refund, your style' campaigns." },
  { name: "Festive Quarter GDP Boost", date2026: "2026-10-01", impact: "positive", luxuryEffect: "Q3 GDP highest due to festive spending. Consumer confidence at peak. Luxury +30-50%.", adStrategy: "ALL-IN on luxury campaigns. Maximum budget allocation for Oct-Dec." },
];

export async function getEconomicSentimentSignals(): Promise<Signal[]> {
  const today = new Date();
  const signals: Signal[] = [];

  const IST_MS = 5.5 * 3600000;
  const todayIST = new Date(today.getTime() + IST_MS);
  const todayDateIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());

  // Live market data
  const nifty = await fetchNiftyData();

  if (nifty) {
    // Sensex/Nifty at all-time high = luxury spending confidence
    if (nifty.isATH) {
      signals.push({
        id: signalId("economic", "nifty-ath"),
        type: "economic",
        source: "Yahoo Finance (live)",
        title: `Nifty 50 near all-time high (${nifty.price.toLocaleString("en-IN")}) — luxury spending confidence HIGH`,
        description: `Markets at ATH signals wealth effect — HNI consumers feel richer and spend more on luxury. Historically, luxury e-commerce sees +15-25% lift when markets are at highs.`,
        location: "India",
        severity: "high",
        triggersWhat: "Wealth effect — consumers feel richer. All luxury categories benefit.",
        targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
        suggestedBrands: ["All luxury brands"],
        suggestedAction: "Markets at ATH = luxury spending confidence. Increase ad budgets. Consumers feel wealthy — push premium/luxury tier products, not just accessible.",
        confidence: 0.8,
        expiresAt: expiresIn(48),
        data: { niftyPrice: nifty.price, change: nifty.changePercent, isATH: true, autoDetected: true },
        detectedAt: today,
      });
    }

    // Big market drop (>2% in a day) = caution signal
    if (nifty.changePercent < -2) {
      signals.push({
        id: signalId("economic", "market-drop"),
        type: "economic",
        source: "Yahoo Finance (live)",
        title: `Market correction: Nifty down ${Math.abs(nifty.changePercent)}% — luxury sentiment may dip`,
        description: `Significant market drop affects luxury spending sentiment. HNI consumers may delay big purchases. Focus on accessible luxury and value messaging.`,
        location: "India",
        severity: "medium",
        triggersWhat: "Market correction — shift to accessible luxury positioning",
        targetArchetypes: ["Urban Achiever", "Aspirant"],
        suggestedBrands: ["Coach", "Michael Kors", "Kate Spade", "Armani Exchange"],
        suggestedAction: "Market drop — shift budget from luxury tier to accessible luxury. Push value messaging, EMI options. Pause high-ticket campaigns temporarily.",
        confidence: 0.75,
        expiresAt: expiresIn(48),
        data: { niftyPrice: nifty.price, change: nifty.changePercent, autoDetected: true },
        detectedAt: today,
      });
    }
  }

  // Calendar-based economic events
  for (const event of ECONOMIC_EVENTS_2026) {
    const eventDate = new Date(event.date2026);
    const eventClean = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const daysUntil = Math.round((eventClean.getTime() - todayDateIST.getTime()) / 86400000);

    if (daysUntil > -7 && daysUntil <= 14 && event.impact === "positive") {
      const isDuring = daysUntil <= 0;
      signals.push({
        id: signalId("economic", event.name.toLowerCase().replace(/\s+/g, "-")),
        type: "economic",
        source: "Economic Calendar",
        title: isDuring
          ? `${event.name} — luxury spending boost ACTIVE`
          : `${event.name} in ${daysUntil} days`,
        description: `${event.luxuryEffect}`,
        location: "India",
        severity: isDuring ? "high" as const : "medium" as const,
        triggersWhat: "Economic tailwind for luxury spending",
        targetArchetypes: ["Urban Achiever", "Aspirant"],
        suggestedBrands: ["Hugo Boss", "Coach", "Versace", "Michael Kors"],
        suggestedAction: event.adStrategy,
        confidence: 0.85,
        expiresAt: new Date(eventClean.getTime() + 14 * 86400000),
        data: { event: event.name, impact: event.impact, autoDetected: false },
        detectedAt: today,
      });
    }
  }

  return signals;
}
