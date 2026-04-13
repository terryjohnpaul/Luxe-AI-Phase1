/**
 * Gift Occasion Signals — luxury retailers
 * Detects upcoming gifting moments with luxury-specific product recommendations.
 * Different buying psychology: gift buyer ≠ self-buyer.
 * Source: Calendar-based (no API needed)
 */

import { Signal, signalId, expiresIn } from "./types";

interface GiftOccasion {
  name: string;
  date2026: string;
  recipient: string;
  giftBudgetRange: string;
  topGiftBrands: string[];
  giftProducts: string[];
  adAngle: string;
  targetBuyer: string;
  urgencyDaysBefore: number;
}

const GIFT_OCCASIONS_2026: GiftOccasion[] = [
  {
    name: "Valentine's Day",
    date2026: "2026-02-14",
    recipient: "Partner (M→F and F→M)",
    giftBudgetRange: "₹5,000-25,000",
    topGiftBrands: ["Coach", "Kate Spade", "Michael Kors", "Swarovski", "Marc Jacobs"],
    giftProducts: ["Coach Tabby bag", "Kate Spade wallet", "Swarovski jewelry", "Marc Jacobs perfume", "Michael Kors watch"],
    adAngle: "The gift she'll actually love. Luxury gifts that say 'I know your taste.' Free gift wrapping on luxury retailers.",
    targetBuyer: "Men 25-40 buying for partners, Women 25-40 buying accessories for partners",
    urgencyDaysBefore: 10,
  },
  {
    name: "Mother's Day",
    date2026: "2026-05-10",
    recipient: "Mother",
    giftBudgetRange: "₹3,000-15,000",
    topGiftBrands: ["Coach", "Michael Kors", "Kate Spade", "Swarovski", "Max Mara"],
    giftProducts: ["Coach crossbody bag", "Michael Kors tote", "Swarovski pendant", "Kate Spade cardholder", "Cashmere scarf"],
    adAngle: "She gave you everything. Give her something she'd never buy herself. Luxury Mother's Day gifts on luxury retailers.",
    targetBuyer: "Adults 25-45 buying for mothers",
    urgencyDaysBefore: 14,
  },
  {
    name: "Father's Day",
    date2026: "2026-06-21",
    recipient: "Father",
    giftBudgetRange: "₹5,000-20,000",
    topGiftBrands: ["Hugo Boss", "TUMI", "Paul Smith", "Armani Exchange", "Lacoste"],
    giftProducts: ["Hugo Boss wallet", "TUMI briefcase", "Paul Smith belt", "Hugo Boss polo", "Lacoste watch"],
    adAngle: "Upgrade his style. Luxury gifts for dads who deserve better than a mug. Shop on luxury retailers.",
    targetBuyer: "Adults 25-40 buying for fathers",
    urgencyDaysBefore: 14,
  },
  {
    name: "Raksha Bandhan",
    date2026: "2026-08-12",
    recipient: "Siblings (Brother↔Sister)",
    giftBudgetRange: "₹3,000-20,000",
    topGiftBrands: ["Coach", "Armani Exchange", "Kate Spade", "Michael Kors", "Diesel"],
    giftProducts: ["Coach wallet for sister", "Armani Exchange t-shirt for brother", "Kate Spade crossbody", "Diesel bag for brother"],
    adAngle: "Rakhi gifts they'll actually use. Skip the box of sweets — give luxury. Shop on luxury retailers.",
    targetBuyer: "Siblings 20-35, both genders",
    urgencyDaysBefore: 10,
  },
  {
    name: "Diwali Gifting",
    date2026: "2026-10-20",
    recipient: "Family, Friends, Corporate",
    giftBudgetRange: "₹5,000-50,000",
    topGiftBrands: ["Coach", "Hugo Boss", "TUMI", "Michael Kors", "Swarovski", "Kate Spade"],
    giftProducts: ["Luxury gift sets", "Coach bags", "TUMI travel accessories", "Hugo Boss perfume set", "Swarovski crystal items"],
    adAngle: "Diwali gifts that make an impression. Corporate gifting, family gifts, premium packaging. luxury retailers.",
    targetBuyer: "Adults 25-50, corporate buyers, family gifters",
    urgencyDaysBefore: 21,
  },
  {
    name: "Christmas",
    date2026: "2026-12-25",
    recipient: "Partner, Friends, Family",
    giftBudgetRange: "₹5,000-30,000",
    topGiftBrands: ["Coach", "Marc Jacobs", "Jimmy Choo", "Michael Kors", "Kate Spade", "Swarovski"],
    giftProducts: ["Designer bags", "Luxury accessories", "Statement shoes", "Jewelry", "Wallets"],
    adAngle: "The luxury of giving. Christmas gifts from the world's best brands. Free luxury wrapping on luxury retailers.",
    targetBuyer: "Urban 25-45, Christian community, metro cities celebrating Christmas",
    urgencyDaysBefore: 21,
  },
  {
    name: "Birthday Gifting (always-on)",
    date2026: "2026-01-01", // Always active
    recipient: "Anyone",
    giftBudgetRange: "₹3,000-25,000",
    topGiftBrands: ["Coach", "Kate Spade", "Michael Kors", "Hugo Boss", "Swarovski"],
    giftProducts: ["Wallets", "Card holders", "Perfumes", "Small leather goods", "Jewelry"],
    adAngle: "The gift they'll post on Instagram. Luxury birthday gifts starting ₹3,000 on luxury retailers.",
    targetBuyer: "Adults 20-40 searching for gift ideas",
    urgencyDaysBefore: 365, // Always active
  },
];

export function getGiftOccasionSignals(): Signal[] {
  const now = new Date();
  const signals: Signal[] = [];

  for (const occasion of GIFT_OCCASIONS_2026) {
    const eventDate = new Date(occasion.date2026);
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / 86400000);

    // Birthday gifting is always active
    if (occasion.name === "Birthday Gifting (always-on)") {
      signals.push({
        id: signalId("gift", "birthday-always-on"),
        type: "life_event",
        source: "gift-intelligence",
        title: `Always-on: Luxury birthday gift demand — ${occasion.giftProducts.slice(0, 3).join(", ")}`,
        description: `${occasion.adAngle}\n\nTOP GIFT PRODUCTS: ${occasion.giftProducts.join(", ")}. Budget range: ${occasion.giftBudgetRange}. Target: ${occasion.targetBuyer}.`,
        location: "Pan India",
        severity: "low",
        triggersWhat: occasion.giftProducts.join(", "),
        targetArchetypes: ["Occasional Splurger", "Urban Achiever"],
        suggestedBrands: occasion.topGiftBrands,
        confidence: 0.7,
        suggestedAction: `Run always-on gift ads: "Luxury gifts starting ₹3,000". Target "birthday gift ideas luxury" keywords. Push ${occasion.topGiftBrands.slice(0, 3).join(", ")} wallets and accessories on luxury retailers.`,
        expiresAt: expiresIn(720),
        data: { occasion: occasion.name, budget: occasion.giftBudgetRange },
        detectedAt: now,
      });
      continue;
    }

    // Show signal when within urgency window
    if (daysUntil > 0 && daysUntil <= occasion.urgencyDaysBefore) {
      const severity = daysUntil <= 3 ? "critical" as const
        : daysUntil <= 7 ? "high" as const
        : "medium" as const;

      signals.push({
        id: signalId("gift", occasion.name.toLowerCase().replace(/\s+/g, "-")),
        type: "life_event",
        source: "gift-intelligence",
        title: `${occasion.name} in ${daysUntil} days — luxury gifting window open`,
        description: `${occasion.adAngle}\n\nRECIPIENT: ${occasion.recipient}. BUDGET: ${occasion.giftBudgetRange}.\nTOP GIFTS: ${occasion.giftProducts.join(", ")}.\nTARGET BUYER: ${occasion.targetBuyer}.`,
        location: "Pan India",
        severity,
        triggersWhat: occasion.giftProducts.join(", "),
        targetArchetypes: ["Occasional Splurger", "Urban Achiever"],
        suggestedBrands: occasion.topGiftBrands,
        confidence: 0.9,
        suggestedAction: `LAUNCH ${occasion.name} gift campaign NOW. ${daysUntil} days left. Push ${occasion.topGiftBrands.slice(0, 3).join(", ")} on luxury retailers. Target: ${occasion.targetBuyer}. Budget range: ${occasion.giftBudgetRange}.`,
        expiresAt: eventDate,
        data: { occasion: occasion.name, daysUntil, recipient: occasion.recipient, budget: occasion.giftBudgetRange },
        detectedAt: now,
      });
    }
  }

  return signals;
}
