/**
 * News & Celebrity Signals
 * Detects: Celebrity fashion moments, brand mentions in news, viral moments
 * Source: NewsAPI.org (free: 100 req/day) + Google News RSS
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

// Celebrities to monitor (expand as needed)
const MONITORED_CELEBRITIES = [
  "Virat Kohli", "Deepika Padukone", "Ranveer Singh", "Alia Bhatt",
  "Ranbir Kapoor", "Anushka Sharma", "Priyanka Chopra", "Shah Rukh Khan",
  "Janhvi Kapoor", "Sara Ali Khan", "Kiara Advani", "Sidharth Malhotra",
  "Vicky Kaushal", "Katrina Kaif", "Varun Dhawan", "Shraddha Kapoor",
  "Malaika Arora", "Kareena Kapoor", "Sonam Kapoor", "Shahid Kapoor",
  "MS Dhoni", "Rohit Sharma", "KL Rahul", "Rishabh Pant",
  "Nita Ambani", "Isha Ambani", "Natasha Poonawalla", "Gauri Khan",
  "Mira Rajput", "Ananya Panday", "Suhana Khan", "Khushi Kapoor",
];

// Brands to monitor in news
const MONITORED_BRANDS = [
  "Ami Paris", "Hugo Boss", "Diesel", "Kenzo", "All Saints", "Coach",
  "Michael Kors", "Kate Spade", "Jimmy Choo", "Bottega Veneta",
  "Prada", "Versace", "Emporio Armani", "Farm Rio", "Cult Gaia",
  "Stella McCartney", "Jacquemus", "Casablanca", "Moncler",
  "Self Portrait", "Acne Studios", "Paul Smith", "Ted Baker",
  "Zimmermann", "TUMI", "Swarovski",
];

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
}

async function searchNews(query: string): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const resp = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description,
      source: a.source?.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));
  } catch {
    return [];
  }
}

export async function getNewsCelebritySignals(): Promise<Signal[]> {
  const today = new Date();
  const signals: Signal[] = [];
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    // Return demo signals when no API key
    signals.push({
      id: signalId("news", "demo-celebrity"),
      type: "celebrity",
      source: "demo-data",
      title: "Celebrity fashion monitoring active (connect NewsAPI for real data)",
      description: `Monitoring ${MONITORED_CELEBRITIES.length} celebrities and ${MONITORED_BRANDS.length} brands. Add NEWS_API_KEY to .env for real-time alerts.`,
      location: "Pan India",
      severity: "low",
      triggersWhat: "Celebrity outfit moments drive brand searches",
      targetArchetypes: ["Fashion Loyalist"],
      suggestedBrands: MONITORED_BRANDS.slice(0, 5),
      suggestedAction: "Add NEWS_API_KEY to .env to enable real-time celebrity fashion monitoring.",
      confidence: 0.30,
      expiresAt: expiresIn(24),
      data: { monitored: { celebrities: MONITORED_CELEBRITIES.length, brands: MONITORED_BRANDS.length } },
      detectedAt: today,
    });
    return signals;
  }

  // Search for celebrity + fashion mentions
  const celebFashionArticles = await searchNews("Bollywood celebrity fashion outfit 2026");

  for (const article of celebFashionArticles) {
    // Check if any monitored celebrity is mentioned
    const mentionedCeleb = MONITORED_CELEBRITIES.find(c =>
      article.title?.toLowerCase().includes(c.toLowerCase()) ||
      article.description?.toLowerCase().includes(c.toLowerCase())
    );

    // Check if any monitored brand is mentioned
    const mentionedBrand = MONITORED_BRANDS.find(b =>
      article.title?.toLowerCase().includes(b.toLowerCase()) ||
      article.description?.toLowerCase().includes(b.toLowerCase())
    );

    if (mentionedCeleb || mentionedBrand) {
      signals.push({
        id: signalId("news", `celeb-${(mentionedCeleb || mentionedBrand || "").toLowerCase().replace(/\s+/g, "-")}`),
        type: "celebrity",
        source: "newsapi",
        title: mentionedCeleb && mentionedBrand
          ? `${mentionedCeleb} spotted in ${mentionedBrand}`
          : mentionedCeleb
          ? `${mentionedCeleb} fashion moment in news`
          : `${mentionedBrand} mentioned in celebrity fashion news`,
        description: `${article.title}. Source: ${article.source}`,
        location: "Pan India",
        severity: mentionedCeleb && mentionedBrand ? "high" : "medium",
        triggersWhat: mentionedBrand
          ? `Push ${mentionedBrand} products. Ride the celebrity association.`
          : "Monitor for brand identification. Create 'get the look' content.",
        targetArchetypes: ["Fashion Loyalist", "Aspirant"],
        suggestedBrands: mentionedBrand ? [mentionedBrand] : ["All brands — identify the outfit"],
        suggestedAction: mentionedCeleb && mentionedBrand
          ? `${mentionedCeleb} wearing ${mentionedBrand}! Boost ${mentionedBrand} campaigns. Consider topical Reels content.`
          : `Celebrity fashion moment detected. Check article and create relevant content.`,
        confidence: 0.60,
        expiresAt: expiresIn(48),
        data: { article, mentionedCeleb, mentionedBrand },
        detectedAt: today,
      });
    }
  }

  // Search for luxury fashion India news
  const luxuryNews = await searchNews("luxury fashion India brand launch 2026");
  for (const article of luxuryNews.slice(0, 3)) {
    const mentionedBrand = MONITORED_BRANDS.find(b =>
      article.title?.toLowerCase().includes(b.toLowerCase())
    );

    if (mentionedBrand) {
      signals.push({
        id: signalId("news", `brand-news-${mentionedBrand.toLowerCase().replace(/\s+/g, "-")}`),
        type: "social_trend",
        source: "newsapi",
        title: `${mentionedBrand} in fashion news`,
        description: `${article.title}. Source: ${article.source}`,
        location: "Pan India",
        severity: "low",
        triggersWhat: `Brand awareness boost for ${mentionedBrand}`,
        targetArchetypes: ["Fashion Loyalist"],
        suggestedBrands: [mentionedBrand],
        suggestedAction: `${mentionedBrand} in news. Consider boosting brand campaigns. Monitor for trend.`,
        confidence: 0.45,
        expiresAt: expiresIn(72),
        data: article,
        detectedAt: today,
      });
    }
  }

  return signals;
}

export { MONITORED_CELEBRITIES, MONITORED_BRANDS };
