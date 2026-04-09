"use client";

import { useState } from "react";
import { Shield, Sparkles, ShoppingBag, ChevronDown, ChevronRight, Check, X, Edit3, Save, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_BRAND_CONFIGS, TIER_RULES, type BrandConfig, type BrandTier } from "@/lib/signals/brand-config";

const tierColors: Record<BrandTier, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  luxury: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: Sparkles },
  premium: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Shield },
  accessible: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: ShoppingBag },
};

function getStoredActiveTiers(): BrandTier[] {
  if (typeof window === "undefined") return ["luxury", "premium", "accessible"];
  try {
    const stored = localStorage.getItem("luxeai-active-tiers");
    return stored ? JSON.parse(stored) : ["luxury", "premium", "accessible"];
  } catch { return ["luxury", "premium", "accessible"]; }
}

export default function BrandSettingsPage() {
  const [brands, setBrands] = useState(DEFAULT_BRAND_CONFIGS);
  const [activeTiers, setActiveTiers] = useState<BrandTier[]>(getStoredActiveTiers);

  const toggleTier = (tier: BrandTier) => {
    setActiveTiers(prev => {
      const next = prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier];
      if (next.length === 0) return prev; // must have at least one
      localStorage.setItem("luxeai-active-tiers", JSON.stringify(next));
      return next;
    });
  };
  const [expandedTier, setExpandedTier] = useState<BrandTier | null>("luxury");
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [showRules, setShowRules] = useState<BrandTier | null>(null);

  const brandsByTier = (tier: BrandTier) =>
    Object.values(brands).filter(b => b.tier === tier).sort((a, b) => a.name.localeCompare(b.name));

  const changeTier = (brandName: string, newTier: BrandTier) => {
    setBrands(prev => {
      const brand = prev[brandName];
      if (!brand) return prev;

      const tierDefaults: Record<BrandTier, Partial<BrandConfig>> = {
        luxury: { canDiscount: false, maxDiscountPercent: 0, showPrice: false, showEmi: false, urgencyMessaging: false, scarcityMessaging: true, ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial", targetArchetypes: ["Fashion Loyalist"] },
        premium: { canDiscount: true, maxDiscountPercent: 20, showPrice: true, showEmi: false, urgencyMessaging: false, scarcityMessaging: true, ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "mixed", targetArchetypes: ["Fashion Loyalist", "Urban Achiever"] },
        accessible: { canDiscount: true, maxDiscountPercent: 35, showPrice: true, showEmi: true, urgencyMessaging: true, scarcityMessaging: false, ctaStyle: "direct", adFrequency: "high", retargetingWindow: 30, contentStyle: "product", targetArchetypes: ["Urban Achiever", "Aspirant"] },
      };

      return {
        ...prev,
        [brandName]: { ...brand, tier: newTier, ...tierDefaults[newTier] },
      };
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Tier Settings</h1>
          <p className="text-sm text-muted mt-1">
            Configure marketing rules per brand tier. Luxury brands get different ad treatment than accessible brands.
          </p>
        </div>
      </div>

      {/* Active Tier Selector */}
      <div className="glass-card p-5 border-2 border-brand-blue">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><Sparkles size={16} className="text-brand-blue" /> Show Recommendations For</h2>
            <p className="text-xs text-muted mt-0.5">Select which brand tiers you want to see ad recommendations for on the Command Center</p>
          </div>
          <div className="flex gap-3">
            {(["luxury", "premium", "accessible"] as const).map((tier) => {
              const colors = tierColors[tier];
              const isActive = activeTiers.includes(tier);
              const Icon = colors.icon;
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium",
                    isActive
                      ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm`
                      : "bg-white text-muted border-card-border opacity-50 hover:opacity-75"
                  )}
                >
                  <Icon size={16} />
                  {TIER_RULES[tier].label}
                  {isActive && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted mt-3">
          Currently showing: {activeTiers.map(t => TIER_RULES[t].label).join(" + ")} brands.
          {activeTiers.length === 1 && activeTiers[0] === "luxury" && " Only Fashion Loyalist targeting and aspirational messaging will be used."}
          {activeTiers.length === 1 && activeTiers[0] === "accessible" && " EMI options, urgency messaging, and Aspirant targeting will be included."}
        </p>
      </div>

      {/* Tier Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["luxury", "premium", "accessible"] as const).filter(t => activeTiers.includes(t)).map((tier) => {
          const rule = TIER_RULES[tier];
          const colors = tierColors[tier];
          const Icon = colors.icon;
          const count = brandsByTier(tier).length;

          return (
            <div key={tier} className={cn("glass-card p-5 border-2", colors.border)}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2 rounded-lg", colors.bg)}>
                  <Icon size={20} className={colors.text} />
                </div>
                <div>
                  <h3 className="font-semibold">{rule.label}</h3>
                  <p className="text-xs text-muted">{count} brands</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary mb-3">{rule.description}</p>
              <button
                onClick={() => setShowRules(showRules === tier ? null : tier)}
                className="text-xs text-brand-blue hover:underline flex items-center gap-1"
              >
                <Info size={12} />
                {showRules === tier ? "Hide rules" : "View marketing rules"}
              </button>
              {showRules === tier && (
                <div className="mt-3 p-3 bg-surface rounded-lg">
                  <p className="text-[10px] font-semibold text-muted mb-2">MARKETING RULES</p>
                  <ul className="space-y-1">
                    {rule.rules.map((r, i) => (
                      <li key={i} className="text-[11px] text-text-secondary flex items-start gap-1.5">
                        <span className={cn("shrink-0 mt-0.5", r.startsWith("NEVER") || r.startsWith("DO NOT") ? "text-red-500" : "text-green-500")}>
                          {r.startsWith("NEVER") || r.startsWith("DO NOT") ? <X size={10} /> : <Check size={10} />}
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Brand List by Tier */}
      {(["luxury", "premium", "accessible"] as const).filter(t => activeTiers.includes(t)).map((tier) => {
        const rule = TIER_RULES[tier];
        const colors = tierColors[tier];
        const tierBrands = brandsByTier(tier);
        const isExpanded = expandedTier === tier;

        return (
          <div key={tier} className="glass-card overflow-hidden">
            <button
              onClick={() => setExpandedTier(isExpanded ? null : tier)}
              className="w-full flex items-center justify-between p-4 hover:bg-surface/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={cn("text-xs px-3 py-1 rounded-full font-semibold", colors.bg, colors.text)}>
                  {rule.label.toUpperCase()}
                </span>
                <span className="font-semibold text-sm">{tierBrands.length} brands</span>
                <span className="text-xs text-muted">
                  {tier === "luxury" ? "No discounts, aspirational only" :
                   tier === "premium" ? "Selective discounts, mix of aspiration + product" :
                   "Discounts OK, value messaging, EMI"}
                </span>
              </div>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isExpanded && (
              <div className="border-t border-card-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface text-xs text-muted border-b border-card-border">
                      <th className="text-left py-2.5 px-4 font-medium">Brand</th>
                      <th className="text-left py-2.5 px-4 font-medium">Price Range</th>
                      <th className="text-center py-2.5 px-4 font-medium">Discount</th>
                      <th className="text-center py-2.5 px-4 font-medium">Show Price</th>
                      <th className="text-center py-2.5 px-4 font-medium">EMI</th>
                      <th className="text-center py-2.5 px-4 font-medium">Urgency Ads</th>
                      <th className="text-left py-2.5 px-4 font-medium">Target</th>
                      <th className="text-left py-2.5 px-4 font-medium">Tone</th>
                      <th className="text-center py-2.5 px-4 font-medium">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierBrands.map((brand) => (
                      <tr key={brand.name} className="border-b border-card-border hover:bg-surface/30">
                        <td className="py-3 px-4 font-semibold">{brand.name}</td>
                        <td className="py-3 px-4 text-xs text-muted">{brand.priceRange}</td>
                        <td className="py-3 px-4 text-center">
                          {brand.canDiscount ? (
                            <span className="text-xs text-green-600">Up to {brand.maxDiscountPercent}%</span>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">NEVER</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {brand.showPrice ? <Check size={14} className="text-green-500 mx-auto" /> : <X size={14} className="text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {brand.showEmi ? <Check size={14} className="text-green-500 mx-auto" /> : <X size={14} className="text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {brand.urgencyMessaging ? <Check size={14} className="text-green-500 mx-auto" /> : <X size={14} className="text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted">{brand.targetArchetypes.join(", ")}</td>
                        <td className="py-3 px-4 text-xs text-muted max-w-[150px] truncate" title={brand.messagingTone}>{brand.messagingTone}</td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={brand.tier}
                            onChange={(e) => changeTier(brand.name, e.target.value as BrandTier)}
                            className={cn(
                              "text-[10px] px-2 py-1 rounded-full font-medium border-0 cursor-pointer",
                              tierColors[brand.tier].bg, tierColors[brand.tier].text
                            )}
                          >
                            <option value="luxury">Luxury</option>
                            <option value="premium">Premium</option>
                            <option value="accessible">Accessible</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* How This Affects Ads */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">How Brand Tiers Affect Ad Recommendations</h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="font-semibold text-purple-700 mb-2">Luxury Brand Ad</p>
            <p className="text-text-secondary">Headline: "Discover Bottega Veneta"</p>
            <p className="text-text-secondary">CTA: "Explore Collection"</p>
            <p className="text-text-secondary">No price shown. No EMI. No urgency.</p>
            <p className="text-text-secondary">Editorial imagery. 1x/week frequency.</p>
            <p className="text-text-secondary">90-day retargeting. Loyalists only.</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-700 mb-2">Premium Brand Ad</p>
            <p className="text-text-secondary">Headline: "Ami Paris Heart Polo — INR 12,500"</p>
            <p className="text-text-secondary">CTA: "Shop Now"</p>
            <p className="text-text-secondary">Price shown. Scarcity OK ("Only 4 left").</p>
            <p className="text-text-secondary">Mix editorial + product. 3x/week.</p>
            <p className="text-text-secondary">60-day retargeting. Loyalists + Achievers.</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="font-semibold text-green-700 mb-2">Accessible Brand Ad</p>
            <p className="text-text-secondary">Headline: "Coach Tabby Bag — INR 18,999 or INR 3,166/mo"</p>
            <p className="text-text-secondary">CTA: "Shop Now — EMI Available"</p>
            <p className="text-text-secondary">Price + EMI + urgency ("Sale ends Sunday").</p>
            <p className="text-text-secondary">Product imagery. 5x/week frequency.</p>
            <p className="text-text-secondary">30-day retargeting. Achievers + Aspirants.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
