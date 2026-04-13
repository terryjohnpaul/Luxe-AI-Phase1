/**
 * Fashion Event Calendar — AUTO-DETECTED + Calendar Fallback
 * Uses NewsAPI to detect upcoming/ongoing fashion events.
 * Falls back to hardcoded calendar for known annual events.
 */

import { Signal, signalId, expiresIn } from "./types";

interface FashionEvent {
  name: string;
  date2026: string;
  endDate2026?: string;
  type: "fashion_week" | "awards" | "red_carpet" | "luxury_event";
  location: string;
  impactOnIndia: "very_high" | "high" | "medium";
  brandsMostAffected: string[];
  searchSpike: string;
  adOpportunity: string;
  daysBeforeToSignal: number;
}

// Known annual events — dates are predictable year to year
const FASHION_EVENTS_2026: FashionEvent[] = [
  { name: "Filmfare Awards", date2026: "2026-01-18", type: "awards", location: "Mumbai", impactOnIndia: "very_high", brandsMostAffected: ["Hugo Boss", "Versace", "Jimmy Choo"], searchSpike: "India's most-watched fashion red carpet", adOpportunity: "Run 'as seen on red carpet' campaigns during Filmfare.", daysBeforeToSignal: 7 },
  { name: "Lakme Fashion Week", date2026: "2026-03-12", endDate2026: "2026-03-16", type: "fashion_week", location: "Mumbai", impactOnIndia: "very_high", brandsMostAffected: ["All luxury brands"], searchSpike: "'Fashion week' searches +500% in India", adOpportunity: "MUST advertise during Lakme FW. Peak fashion engagement.", daysBeforeToSignal: 14 },
  { name: "Met Gala", date2026: "2026-05-04", type: "red_carpet", location: "New York", impactOnIndia: "very_high", brandsMostAffected: ["Versace", "Gucci", "Prada", "Louis Vuitton", "Dior"], searchSpike: "300%+ luxury search spike globally", adOpportunity: "If any Indian celeb attends — run their brand campaigns IMMEDIATELY.", daysBeforeToSignal: 7 },
  { name: "Cannes Film Festival", date2026: "2026-05-12", endDate2026: "2026-05-23", type: "red_carpet", location: "Cannes", impactOnIndia: "very_high", brandsMostAffected: ["Louis Vuitton", "Dior", "Chanel", "Jimmy Choo", "Versace"], searchSpike: "Indian celebrities on Cannes red carpet = top trending", adOpportunity: "Deepika, Aishwarya at Cannes = massive search spike.", daysBeforeToSignal: 14 },
  { name: "IIFA Awards", date2026: "2026-06-14", type: "awards", location: "International", impactOnIndia: "very_high", brandsMostAffected: ["Versace", "Gucci", "Hugo Boss", "Jimmy Choo"], searchSpike: "Bollywood fashion dissected on Instagram", adOpportunity: "Run 'get the look' campaigns for every outfit.", daysBeforeToSignal: 7 },
  { name: "GQ Best Dressed", date2026: "2026-06-20", type: "awards", location: "Mumbai", impactOnIndia: "high", brandsMostAffected: ["Hugo Boss", "Gucci", "Emporio Armani", "Diesel"], searchSpike: "Men's luxury fashion spike", adOpportunity: "Target men's luxury during GQ Awards.", daysBeforeToSignal: 5 },
  { name: "FDCI India Couture Week", date2026: "2026-07-20", endDate2026: "2026-07-26", type: "fashion_week", location: "Delhi", impactOnIndia: "high", brandsMostAffected: ["Versace", "Jimmy Choo", "Hugo Boss"], searchSpike: "Couture + luxury searches spike in North India", adOpportunity: "Target Delhi NCR during ICW.", daysBeforeToSignal: 10 },
  { name: "New York Fashion Week", date2026: "2026-09-10", endDate2026: "2026-09-16", type: "fashion_week", location: "New York", impactOnIndia: "medium", brandsMostAffected: ["Coach", "Marc Jacobs", "Ralph Lauren", "Michael Kors"], searchSpike: "Coach, Marc Jacobs searches +80-150%", adOpportunity: "Run brand campaigns during NYFW buzz.", daysBeforeToSignal: 7 },
  { name: "Milan Fashion Week", date2026: "2026-09-22", endDate2026: "2026-09-28", type: "fashion_week", location: "Milan", impactOnIndia: "high", brandsMostAffected: ["Versace", "Prada", "Gucci", "Diesel", "Emporio Armani", "Bottega Veneta"], searchSpike: "Italian luxury searches +100-200%", adOpportunity: "Run Versace, Armani campaigns during MFW.", daysBeforeToSignal: 7 },
  { name: "Paris Fashion Week", date2026: "2026-09-28", endDate2026: "2026-10-06", type: "fashion_week", location: "Paris", impactOnIndia: "very_high", brandsMostAffected: ["Louis Vuitton", "Dior", "Chanel", "Balenciaga", "Jacquemus", "Kenzo"], searchSpike: "PFW = #1 fashion event. Luxury searches +200-400%", adOpportunity: "Peak luxury attention globally. Every brand should advertise.", daysBeforeToSignal: 10 },
  { name: "Vogue Women of the Year", date2026: "2026-10-20", type: "awards", location: "Mumbai", impactOnIndia: "high", brandsMostAffected: ["Max Mara", "Jimmy Choo", "Versace", "Dior"], searchSpike: "Women's luxury + empowerment", adOpportunity: "Target women's luxury during Vogue WOTY.", daysBeforeToSignal: 5 },
];

// Auto-detect fashion events from NewsAPI
async function detectFashionEventsFromNews(): Promise<{ name: string; isHappening: boolean }[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const eventKeywords = [
    "Met Gala 2026", "Cannes Film Festival 2026", "IIFA Awards 2026",
    "Lakme Fashion Week 2026", "Milan Fashion Week", "Paris Fashion Week",
    "Filmfare Awards 2026", "GQ Best Dressed India",
  ];

  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const detected: { name: string; isHappening: boolean }[] = [];

    // Single query with OR to save API calls
    const query = eventKeywords.slice(0, 4).join(" OR ");
    const resp = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&from=${weekAgo}&apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (resp.ok) {
      const data = await resp.json();
      for (const article of (data.articles || [])) {
        const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
        for (const kw of eventKeywords) {
          const kwLower = kw.toLowerCase().replace(" 2026", "");
          if (text.includes(kwLower)) {
            detected.push({ name: kw.replace(" 2026", ""), isHappening: true });
          }
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return detected.filter(d => {
      if (seen.has(d.name)) return false;
      seen.add(d.name);
      return true;
    });
  } catch {
    return [];
  }
}

export async function getFashionEventSignals(): Promise<Signal[]> {
  const today = new Date();
  const signals: Signal[] = [];

  // Auto-detect from news
  const newsDetected = await detectFashionEventsFromNews();
  const detectedNames = new Set(newsDetected.map(d => d.name.toLowerCase()));

  const IST_MS = 5.5 * 3600000;
  const todayIST = new Date(today.getTime() + IST_MS);
  const todayDateIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());

  for (const event of FASHION_EVENTS_2026) {
    const eventDate = new Date(event.date2026);
    const eventMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const daysUntil = Math.round((eventMidnight.getTime() - todayDateIST.getTime()) / 86400000);
    const endDate = event.endDate2026 ? new Date(event.endDate2026) : eventDate;
    const isDuring = today >= eventDate && today <= new Date(endDate.getTime() + 3 * 86400000);

    // Show if: within lead time, during event, OR detected in news
    const isInNews = detectedNames.has(event.name.toLowerCase());
    const shouldShow = (daysUntil > 0 && daysUntil <= event.daysBeforeToSignal) || isDuring || isInNews;

    if (shouldShow) {
      const severity = isDuring || isInNews ? "critical" as const
        : daysUntil <= 3 ? "high" as const
        : "medium" as const;

      const title = isDuring || isInNews
        ? `${event.name} ${isDuring ? "LIVE" : "trending in news"} — luxury searches spiking`
        : `${event.name} in ${daysUntil} days — prepare campaigns`;

      signals.push({
        id: signalId("fashion_event", event.name.toLowerCase().replace(/\s+/g, "-")),
        type: "fashion_event",
        source: isInNews ? "NewsAPI (auto-detected)" : "Fashion Event Calendar",
        title,
        description: `${event.searchSpike}. ${event.adOpportunity}`,
        location: event.location,
        severity,
        triggersWhat: `Fashion event: ${event.type}. Brands: ${event.brandsMostAffected.join(", ")}`,
        targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
        suggestedBrands: event.brandsMostAffected.slice(0, 4),
        suggestedAction: event.adOpportunity,
        confidence: isInNews ? 0.95 : 0.9,
        expiresAt: new Date(endDate.getTime() + 3 * 86400000),
        data: { event: event.name, type: event.type, daysUntil, autoDetected: isInNews },
        detectedAt: today,
      });
    }
  }

  return signals;
}
