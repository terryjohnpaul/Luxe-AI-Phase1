/**
 * Stock Market Sentiment Signals
 * Detects: Sensex/Nifty moves, wealth effect, market sentiment
 * Source: Yahoo Finance (yfinance pattern) or free market APIs
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

interface MarketData {
  index: string;
  value: number;
  change: number;
  changePercent: number;
  isAllTimeHigh: boolean;
}

async function fetchMarketData(): Promise<MarketData | null> {
  try {
    // Using a free market data endpoint
    // In production, use Yahoo Finance API or NSE unofficial API
    const resp = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN?interval=1d&range=5d",
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) }
    );

    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const prices = result.indicators?.quote?.[0]?.close || [];
    const currentPrice = meta.regularMarketPrice || prices[prices.length - 1];
    const previousClose = meta.chartPreviousClose || prices[prices.length - 2];

    if (!currentPrice || !previousClose) return null;

    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Check if near all-time high (within 2%)
    const maxPrice = Math.max(...prices.filter((p: number) => p > 0));
    const isAllTimeHigh = currentPrice >= maxPrice * 0.98;

    return {
      index: "BSE SENSEX",
      value: Math.round(currentPrice),
      change: Math.round(change),
      changePercent: Math.round(changePercent * 100) / 100,
      isAllTimeHigh,
    };
  } catch (error) {
    console.error("[StockMarket] Failed to fetch market data:", error);
    return null;
  }
}

export async function getStockMarketSignals(): Promise<Signal[]> {
  const today = new Date();
  const signals: Signal[] = [];

  // Only check during market hours or after close (9:15 AM - 8 PM IST)
  const hour = today.getHours();
  if (hour < 9 || hour > 20) return signals;

  const market = await fetchMarketData();
  if (!market) return signals;

  // === MARKET SURGE (>1.5% up) — Wealth Effect ===
  if (market.changePercent >= 1.5) {
    signals.push({
      id: signalId("stock", "market-surge"),
      type: "stock_market",
      source: "yahoo-finance",
      title: `Sensex surging +${market.changePercent}% (${market.change > 0 ? "+" : ""}${market.change} points)`,
      description: `Market up ${market.changePercent}% today. Wealth effect kicks in — investors and professionals feel richer. Luxury spending spikes on market-up days.`,
      location: "Pan India (Mumbai, Delhi, Bangalore — financial hubs)",
      severity: market.changePercent >= 3 ? "high" : "medium",
      triggersWhat: "Premium purchases, statement pieces, 'feeling good' splurges",
      targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
      suggestedBrands: ["Hugo Boss", "Emporio Armani", "Bottega Veneta", "Coach"],
      suggestedAction: `Market up ${market.changePercent}%. Boost evening ads (7-11 PM) targeting professionals in financial hubs. 'You deserve it' messaging.`,
      confidence: 0.65,
      expiresAt: expiresIn(12),
      data: market,
      detectedAt: today,
    });
  }

  // === MARKET CRASH (>2% down) — Pull back aggressive ads ===
  if (market.changePercent <= -2) {
    signals.push({
      id: signalId("stock", "market-crash"),
      type: "stock_market",
      source: "yahoo-finance",
      title: `Market down ${market.changePercent}% — consumer sentiment dip`,
      description: `Sensex dropped ${market.changePercent}%. People feel poorer. Reduce aggressive prospecting, maintain retargeting. Value messaging over aspiration.`,
      location: "Pan India",
      severity: "medium",
      triggersWhat: "Shift from aspiration to value messaging. Push essentials over statement pieces.",
      targetArchetypes: ["Aspirant"],
      suggestedBrands: ["Hugo Boss", "All Saints", "Diesel"],
      suggestedAction: `Market down ${market.changePercent}%. Reduce prospecting budgets 10-15%. Switch to value/EMI messaging. Don't push ultra-premium.`,
      confidence: 0.55,
      expiresAt: expiresIn(24),
      data: market,
      detectedAt: today,
    });
  }

  // === ALL-TIME HIGH — Maximum confidence spending ===
  if (market.isAllTimeHigh && market.changePercent > 0) {
    signals.push({
      id: signalId("stock", "ath"),
      type: "stock_market",
      source: "yahoo-finance",
      title: "Sensex near all-time high — peak wealth effect",
      description: `Sensex at ${market.value.toLocaleString()}, near all-time highs. Maximum consumer confidence. Best time for premium brand pushes.`,
      location: "Pan India (financial cities)",
      severity: "high",
      triggersWhat: "Ultra-premium products, halo brands, statement pieces, high-AOV items",
      targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
      suggestedBrands: ["Bottega Veneta", "Ami Paris", "Jacquemus", "Casablanca"],
      suggestedAction: "Market at ATH = maximum confidence. Push premium brands aggressively. Best window for halo brand awareness.",
      confidence: 0.70,
      expiresAt: expiresIn(24),
      data: market,
      detectedAt: today,
    });
  }

  return signals;
}
