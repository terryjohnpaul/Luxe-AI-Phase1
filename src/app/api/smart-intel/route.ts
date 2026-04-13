import { NextResponse } from "next/server";
import {
  getCityRecommendations,
  getBudgetWindows,
  getCreativeFatigueAlerts,
  getEventStacks,
  getSmartRecommendationSignals,
} from "@/lib/signals/smart-recommendations";
import { getOccasionDressingSignals } from "@/lib/signals/occasion-dressing";
import { getGiftOccasionSignals } from "@/lib/signals/gift-occasions";
import { getSaleEventSignals } from "@/lib/signals/sale-events";
import { cachedFetch, registerForPrewarm } from "@/lib/api-cache";

async function fetchSmartIntelData() {
  const cities = getCityRecommendations();
  const budgetWindows = getBudgetWindows();
  const creativeFatigue = getCreativeFatigueAlerts();
  const eventStacks = getEventStacks();

  // Fetch all signal sources (occasion-dressing is async due to Apify call)
  const [smartSignals, occasionSignals, giftSignals, saleSignals] =
    await Promise.all([
      Promise.resolve(getSmartRecommendationSignals()),
      getOccasionDressingSignals(),
      Promise.resolve(getGiftOccasionSignals()),
      Promise.resolve(getSaleEventSignals()),
    ]);

  const allSignals = [
    ...smartSignals,
    ...occasionSignals,
    ...giftSignals,
    ...saleSignals,
  ].sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 };
    return (sev[a.severity] ?? 4) - (sev[b.severity] ?? 4);
  });

  const fatigueAlerts = creativeFatigue.filter(
    (f) => f.fatigueLevel !== "healthy"
  ).length;

  const now = new Date();
  const nowDate = now.getDate();
  const nowDay = now.getDay();
  const nowMonth = now.getMonth();

  const activeWindows = budgetWindows.filter((w) => {
    if (w.id === "salary-week" && (nowDate >= 25 || nowDate <= 3)) return true;
    if (w.id === "weekend-surge" && (nowDay === 0 || nowDay === 6)) return true;
    if (w.id === "monday-fomo" && nowDay === 1) return true;
    if (w.id === "mid-month-lull" && nowDate >= 10 && nowDate <= 20) return true;
    if (w.id === "payday-bonus" && nowMonth === 2) return true;
    if (w.id === "first-salary" && nowMonth === 6 && nowDate <= 10) return true;
    if (w.id === "tax-refund" && (nowMonth === 8 || nowMonth === 9)) return true;
    if (w.id === "late-night") {
      const hour = now.getHours();
      if (hour >= 22 || hour <= 1) return true;
    }
    return false;
  }).length;

  return {
    cities,
    budgetWindows,
    creativeFatigue,
    eventStacks,
    signals: allSignals,
    summary: {
      citiesMonitored: cities.length,
      activeWindows,
      fatigueAlerts,
      activeStacks: eventStacks.length,
      totalSignals: allSignals.length,
    },
  };
}

registerForPrewarm("smart-intel", fetchSmartIntelData);

export async function GET(request: Request) {
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "true";
  const { data } = await cachedFetch("smart-intel", fetchSmartIntelData, forceRefresh);
  return NextResponse.json(data);
}
