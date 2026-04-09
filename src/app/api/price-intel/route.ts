import { NextResponse } from "next/server";
import { getCompetitorPriceChanges } from "@/lib/signals/competitor-pricing";

export async function GET() {
  const priceChanges = getCompetitorPriceChanges();

  const totalMonitored = priceChanges.length;
  const weAreCheaper = priceChanges.filter(c => c.priceAdvantage === "we_are_cheaper").length;
  const theyAreCheaper = priceChanges.filter(c => c.priceAdvantage === "they_are_cheaper").length;
  const activeDiscounts = priceChanges.filter(c => c.discountPercent > 0).length;
  const discounted = priceChanges.filter(c => c.discountPercent > 0);
  const avgDiscount = discounted.length > 0
    ? Math.round(discounted.reduce((sum, c) => sum + c.discountPercent, 0) / discounted.length)
    : 0;

  const cheaperItems = priceChanges.filter(c => c.priceAdvantage === "we_are_cheaper");
  let biggestAdvantage = { brand: "", product: "", savings: 0 };
  if (cheaperItems.length > 0) {
    const best = cheaperItems.reduce((a, b) =>
      (b.currentPrice - b.ourPrice) > (a.currentPrice - a.ourPrice) ? b : a
    );
    biggestAdvantage = {
      brand: best.brand,
      product: best.product,
      savings: best.currentPrice - best.ourPrice,
    };
  }

  return NextResponse.json({
    priceChanges,
    summary: {
      totalMonitored,
      weAreCheaper,
      theyAreCheaper,
      activeDiscounts,
      avgDiscount,
      biggestAdvantage,
    },
  });
}
