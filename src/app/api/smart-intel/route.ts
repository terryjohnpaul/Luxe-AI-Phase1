import { NextResponse } from "next/server";
import {
  getCityRecommendations,
  getBudgetWindows,
  getCreativeFatigueAlerts,
  getEventStacks,
} from "@/lib/signals/smart-recommendations";

export async function GET() {
  const cities = getCityRecommendations();
  const budgetWindows = getBudgetWindows();
  const creativeFatigue = getCreativeFatigueAlerts();
  const eventStacks = getEventStacks();

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

  return NextResponse.json({
    cities,
    budgetWindows,
    creativeFatigue,
    eventStacks,
    summary: {
      citiesMonitored: cities.length,
      activeWindows,
      fatigueAlerts,
      activeStacks: eventStacks.length,
    },
  });
}
