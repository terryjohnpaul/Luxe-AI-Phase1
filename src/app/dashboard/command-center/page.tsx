"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTracking } from "@/lib/tracking/use-tracking";
import {
  AdRecommendationCard,
  type AdRecommendation,
  type EditValues,
} from "@/components/cards/ad-recommendation-card";
import { ToastProvider, showToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ============================================================
// TYPES
// ============================================================

interface ApiSignal {
  id: string;
  type: string;
  source: string;
  title: string;
  description: string;
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  triggersWhat: string;
  targetArchetypes: string[];
  suggestedBrands: string[];
  suggestedAction: string;
  confidence: number;
  expiresAt: string;
  detectedAt: string;
  signalCategory?: "external" | "internal";
  dataSource?: string;
  sourceUrl?: string | null;
}

interface ApiResponse {
  signals: ApiSignal[];
  recommendations: AdRecommendation[];
  signalCount: number;
  recommendationCount: number;
  externalCount?: number;
  internalCount?: number;
  fetchedAt: string;
  sources: Record<string, { enabled: boolean; needsKey: boolean; keyName: string }>;
}

// ============================================================
// MOCK DATA
// ============================================================

function getMockCommandCenterData(): ApiResponse {
  const now = new Date();

  const mockSignals: ApiSignal[] = [
    {
      id: "sig-1",
      type: "life_event",
      source: "Google Trends",
      title: "First Job / Appraisal Season",
      description: "Appraisal season in IT hubs",
      location: "Bangalore, Pune, Hyderabad",
      severity: "critical",
      triggersWhat: "Professional luxury purchases",
      targetArchetypes: ["Urban Achiever"],
      suggestedBrands: ["Hugo Boss", "Coach"],
      suggestedAction: "Target IT professionals",
      confidence: 0.92,
      expiresAt: now.toISOString(),
      detectedAt: now.toISOString(),
      signalCategory: "external",
      dataSource: "Google Trends",
      sourceUrl: "https://trends.google.com/trends/explore?q=appraisal+season+india&geo=IN",
    },
  ];

  const mockRecommendations: AdRecommendation[] = [
    {
      id: "rec-1",
      signalId: "sig-1",
      signalTitle: "First Job / Appraisal Season",
      signalType: "life_event",
      priority: "urgent",
      title: "Appraisal Season Campaign \u2014 Target IT Professionals",
      description: "Professional luxury: blazers, premium shirts, leather bags, watches. Self-reward messaging.",
      creative: {
        direction: "Professional upgrade imagery. 'You earned it' messaging. Focus on career milestone rewards.",
        suggestedFormats: ["Instagram Feed (1:1)", "Instagram Reels (9:16)", "Google Shopping"],
        brands: ["Hugo Boss", "Coach", "Michael Kors"],
        sampleHeadlines: ["You Earned It", "The Upgrade You Deserve", "Reward Your Success"],
        samplePrimaryTexts: [
          "Appraisal season calls for an upgrade. Shop Hugo Boss, Coach, and Michael Kors \u2014 the professional wardrobe you\u2019ve earned.",
          "Celebrate your hard work with premium style. Free delivery, authentic guarantee.",
          "From boardroom to bar. Elevate your professional wardrobe with accessible luxury.",
        ],
        cta: "Shop Now",
      },
      targeting: {
        archetypes: ["Urban Achiever", "Aspirant"],
        location: "Bangalore, Pune, Hyderabad, Mumbai, Delhi NCR",
        timing: "Evening 7-11 PM (post-work browsing)",
        platforms: { meta: "60%", google: "40%", reason: "Balanced split for professional audience" },
      },
      budget: {
        suggested: "\u20B940,000-60,000/day",
        duration: "14 days (appraisal window)",
        bidStrategy: "Cost Cap at \u20B93,500 CPA",
      },
      prediction: {
        confidence: 85,
        estimatedReach: "80K-120K",
        estimatedImpressions: "400K-600K",
        estimatedClicks: "4.8K-7.2K",
        estimatedCTR: "1.1-1.3%",
        estimatedConversions: "28-42",
        estimatedCPA: "\u20B92,800-3,400",
        estimatedRevenue: "\u20B92.4L-3.6L",
        estimatedROAS: "2.8-3.5x",
        campaignGoal: "Conversions",
        factors: [
          "Appraisal season: 14-22% uplift in luxury buying in IT hubs",
          "High purchase intent \u2014 career milestone rewards",
          "Strong brand fit: Hugo Boss, Coach for professionals",
        ],
        methodology: "Based on luxury fashion India benchmarks and historical appraisal season performance",
      },
      executionGuide: {
        meta: "META ADS SETUP:\n1. Campaign: Advantage+ Shopping Campaign (ASC)\n2. Objective: Sales (Conversions)\n3. Budget: \u20B940,000-60,000/day on Meta portion\n4. Audience: Broad targeting with Bangalore, Pune, Hyderabad geo\n5. Placements: Instagram Feed, Instagram Reels\n6. Creative: Professional lifestyle imagery\n7. Bidding: Cost Cap at \u20B93,500 CPA\n8. Schedule: Evening 7-11 PM",
        google: "GOOGLE ADS SETUP:\n1. Campaign: Performance Max\n2. Budget: \u20B940,000-60,000/day on Google portion\n3. Asset Group: \"Appraisal Season Campaign\"\n4. Headlines: Use sample headlines above\n5. Images: Professional lifestyle + product shots\n6. Location: Bangalore, Pune, Hyderabad\n7. Bidding: Maximize Conversion Value with Target ROAS 3.5x",
      },
      indiaRelevance: {
        score: "high",
        note: "Appraisal season: 14-22% uplift in luxury shopping in India IT hubs",
      },
    },
    {
      id: "rec-2",
      signalId: "sig-2",
      signalTitle: "Akshaya Tritiya",
      signalType: "festival",
      priority: "high",
      title: "Akshaya Tritiya \u2014 Launch Gold Campaigns NOW",
      description: "Auspicious day for luxury purchases. Push gold jewelry, watches, premium gifting.",
      creative: {
        direction: "Auspicious buying occasion. Gold-toned products, luxury watches, premium gifts.",
        suggestedFormats: ["Instagram Collection Ads", "Instagram Feed", "Google Shopping"],
        brands: ["Swarovski", "Fossil", "Tissot"],
        sampleHeadlines: ["Akshaya Tritiya Special", "Auspicious Beginnings", "Gold That Lasts Forever"],
        samplePrimaryTexts: [
          "Akshaya Tritiya \u2014 the perfect day for lasting investments. Shop Swarovski, Fossil, Tissot.",
          "Mark this auspicious day with timeless luxury. Free delivery across India.",
          "Start new beginnings with gold that shines forever.",
        ],
        cta: "Shop Collection",
      },
      targeting: {
        archetypes: ["Fashion Loyalist", "Urban Achiever"],
        location: "Pan India",
        timing: "All day \u2014 boost 6 PM-11 PM",
        platforms: { meta: "65%", google: "35%", reason: "Visual products favor Meta" },
      },
      budget: {
        suggested: "\u20B950,000-80,000/day",
        duration: "Until festival day + 3 days post",
        bidStrategy: "Highest Volume",
      },
      prediction: {
        confidence: 88,
        estimatedReach: "120K-180K",
        estimatedImpressions: "600K-900K",
        estimatedClicks: "6.6K-9.9K",
        estimatedCTR: "1.0-1.2%",
        estimatedConversions: "46-69",
        estimatedCPA: "\u20B92,600-3,200",
        estimatedRevenue: "\u20B94.1L-6.2L",
        estimatedROAS: "3.2-4.0x",
        campaignGoal: "Conversions",
        factors: [
          "Festival period: +50-100% conversion lift",
          "Auspicious buying sentiment drives luxury purchases",
          "Gold jewelry and watches high demand",
        ],
        methodology: "Based on festival season benchmarks from India luxury market data",
      },
      executionGuide: {
        meta: "META ADS SETUP:\n1. Campaign: Advantage+ Shopping Campaign\n2. Objective: Sales\n3. Budget: \u20B950,000-80,000/day\n4. Audience: Broad targeting Pan India\n5. Placements: Instagram Feed, Stories, Reels\n6. Creative: Gold-toned products, auspicious imagery\n7. Bidding: Highest Volume\n8. Schedule: All day, boost evenings",
        google: "GOOGLE ADS SETUP:\n1. Campaign: Performance Max\n2. Budget: \u20B950,000-80,000/day\n3. Asset Group: \"Akshaya Tritiya\"\n4. Headlines: Use sample headlines\n5. Images: Gold jewelry, watches\n6. Location: Pan India\n7. Bidding: Maximize Conversion Value",
      },
      indiaRelevance: {
        score: "high",
        note: "Akshaya Tritiya drives 40-60% uplift in luxury purchases",
      },
    },
  ];

  return {
    signals: mockSignals,
    recommendations: mockRecommendations,
    signalCount: mockSignals.length,
    recommendationCount: mockRecommendations.length,
    externalCount: 1,
    internalCount: 0,
    fetchedAt: now.toISOString(),
    sources: {
      "Weather API": { enabled: true, needsKey: false, keyName: "WEATHER_API_KEY" },
      "Google Trends": { enabled: true, needsKey: false, keyName: "" },
      "Festival Calendar": { enabled: true, needsKey: false, keyName: "" },
      "Cricket API": { enabled: false, needsKey: true, keyName: "CRICKET_API_KEY" },
    },
  };
}

// ============================================================
// HELPERS
// ============================================================

function getActiveTiers(): string[] {
  if (typeof window === "undefined") return ["luxury", "premium", "accessible"];
  try {
    const stored = localStorage.getItem("luxeai-active-tiers");
    return stored ? JSON.parse(stored) : ["luxury", "premium", "accessible"];
  } catch {
    return ["luxury", "premium", "accessible"];
  }
}

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function CommandCenterPage() {
  return (
    <ToastProvider>
      <CommandCenterContent />
    </ToastProvider>
  );
}

function CommandCenterContent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { trackExpand, trackCollapse, trackEditStart, trackEditSave, trackApprove, trackSkip, trackGuideOpen } = useTracking();
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [approvedRecs, setApprovedRecs] = useState<Set<string>>(new Set());
  const [skippedRecs, setSkippedRecs] = useState<Set<string>>(new Set());
  const [editingRec, setEditingRec] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, EditValues>>({});
  const [pushingDraft, setPushingDraft] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<Record<string, { success: boolean; message: string; platform?: string } | null>>({});

  // Confirmation dialog state (#26)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    rec: AdRecommendation | null;
    platform: "google" | "meta" | "both";
  }>({ open: false, rec: null, platform: "meta" });

  useEffect(() => {
    fetch("/api/ads/push-draft").then((r) => r.json()).catch(() => {});
  }, []);

  const startEditing = (rec: AdRecommendation) => {
    trackEditStart(rec.id);
    setEditingRec(rec.id);
    if (!editValues[rec.id]) {
      setEditValues((prev) => ({
        ...prev,
        [rec.id]: {
          budget: rec.budget.suggested,
          duration: rec.budget.duration,
          bidStrategy: rec.budget.bidStrategy,
          location: rec.targeting.location,
          timing: rec.targeting.timing,
          headlines: [...rec.creative.sampleHeadlines],
          bodyTexts: [...rec.creative.samplePrimaryTexts],
          cta: rec.creative.cta,
        },
      }));
    }
  };

  const updateEditField = (recId: string, field: string, value: string | string[]) => {
    setEditValues((prev) => ({
      ...prev,
      [recId]: { ...prev[recId], [field]: value },
    }));
  };

  const saveEdits = (recId: string) => {
    trackEditSave(recId, editValues[recId] as unknown as Record<string, unknown> || {});
    // Panel stays open — EditPanel's internal `saved` state switches to summary view
    // with inline Craft buttons. No need to close and hunt for the push button.
  };

  // Confirmation flow: show dialog instead of pushing directly (#26)
  const requestPush = (rec: AdRecommendation, platform: "google" | "meta" | "both") => {
    setConfirmDialog({ open: true, rec, platform });
  };

  const executePush = useCallback(async () => {
    const { rec, platform } = confirmDialog;
    if (!rec) return;
    setConfirmDialog({ open: false, rec: null, platform: "meta" });

    setPushingDraft(rec.id);
    setPushResult((prev) => ({ ...prev, [rec.id]: null }));
    try {
      const edits = editValues[rec.id];
      const res = await fetch("/api/ads/push-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          campaignName: rec.title,
          headlines: edits?.headlines || rec.creative.sampleHeadlines,
          bodyTexts: edits?.bodyTexts || rec.creative.samplePrimaryTexts,
          cta: edits?.cta || rec.creative.cta,
          budget: edits?.budget || rec.budget.suggested,
          duration: edits?.duration || rec.budget.duration,
          bidStrategy: edits?.bidStrategy || rec.budget.bidStrategy,
          location: edits?.location || rec.targeting.location,
          timing: edits?.timing || rec.targeting.timing,
          brands: rec.creative.brands,
          signalTitle: rec.signalTitle,
        }),
      });
      const result = await res.json();
      setPushResult((prev) => ({
        ...prev,
        [rec.id]: { success: result.success, message: result.message, platform },
      }));
      if (result.success) {
        trackApprove(rec.id, !!edits);
        setApprovedRecs((prev) => new Set(prev).add(rec.id));
        // Toast instead of alert (#27)
        showToast({
          type: "success",
          message: `Draft campaign created in ${platform === "meta" ? "Meta" : "Google"} Ads`,
        });
      } else {
        showToast({ type: "error", message: `Failed: ${result.message}` });
      }
    } catch (err: any) {
      setPushResult((prev) => ({
        ...prev,
        [rec.id]: { success: false, message: err.message },
      }));
      showToast({ type: "error", message: `Error: ${err.message}` });
    } finally {
      setPushingDraft(null);
    }
  }, [confirmDialog, editValues, trackApprove]);

  // Skip with undo toast (#28)
  const handleSkip = (recId: string, reason: string) => {
    trackSkip(recId);
    setSkippedRecs((prev) => new Set(prev).add(recId));
    showToast({
      type: "info",
      message: `Skipped: ${reason}`,
      duration: 5000,
      undoAction: () => {
        setSkippedRecs((prev) => {
          const next = new Set(prev);
          next.delete(recId);
          return next;
        });
      },
    });
  };

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const tiers = getActiveTiers().join(",");
      const refresh = forceRefresh ? "&refresh=true" : "";
      const resp = await fetch(`/api/signals/live?mode=full&tiers=${tiers}${refresh}`);
      if (!resp.ok) {
        setData(getMockCommandCenterData());
        setLoading(false);
        return;
      }
      const json = await resp.json();
      setData(json);
    } catch {
      setData(getMockCommandCenterData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRecs = useMemo(() => {
    if (!data) return [];
    return data.recommendations.filter(
      (r) => priorityFilter === "all" || r.priority === priorityFilter
    );
  }, [data, priorityFilter]);

  const recIndexMap = useMemo(() => {
    if (!data) return new Map<string, number>();
    const map = new Map<string, number>();
    data.recommendations.forEach((r, i) => map.set(r.id, i));
    return map;
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-text mx-auto mb-4" />
          <p className="text-sm text-muted">Loading ad recommendations...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const priorityCounts = {
    all: data.recommendations.length,
    urgent: data.recommendations.filter((r) => r.priority === "urgent").length,
    high: data.recommendations.filter((r) => r.priority === "high").length,
    medium: data.recommendations.filter((r) => r.priority === "medium").length,
    opportunity: data.recommendations.filter((r) => r.priority === "opportunity").length,
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Command Center</h1>
          <p className="text-sm text-muted">
            AI-powered ad recommendations ready to deploy
          </p>
        </div>

        {/* Filter bar with counts */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-card-border">
          <div className="flex items-center gap-1">
            {(["all", "urgent", "high", "medium", "opportunity"] as const).map((p) => {
              const count = priorityCounts[p];
              const label = p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1);
              return (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  disabled={count === 0 && p !== "all"}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    priorityFilter === p
                      ? "bg-navy text-white"
                      : count === 0 && p !== "all"
                        ? "text-muted/40 cursor-default"
                        : "text-muted hover:bg-surface"
                  )}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Check size={12} className="text-green-600" /> {approvedRecs.size} Approved
            </span>
            <span className="flex items-center gap-1">
              <X size={12} /> {skippedRecs.size} Skipped
            </span>
          </div>
        </div>

        {/* Recommendation Cards */}
        <div className="space-y-4">
          {filteredRecs.map((rec) => {
            const recIdx = recIndexMap.get(rec.id) ?? 0;
            const matchedSignal = data.signals.find((s) => s.id === rec.signalId);

            return (
              <AdRecommendationCard
                key={rec.id}
                rec={rec}
                recIndex={recIdx}
                signalSource={
                  matchedSignal
                    ? {
                        dataSource: matchedSignal.dataSource,
                        sourceUrl: matchedSignal.sourceUrl,
                        detectedAt: matchedSignal.detectedAt,
                        title: matchedSignal.title,
                        description: matchedSignal.description,
                        type: matchedSignal.type,
                        severity: matchedSignal.severity,
                        confidence: matchedSignal.confidence,
                        location: matchedSignal.location,
                        targetArchetypes: matchedSignal.targetArchetypes,
                        suggestedBrands: matchedSignal.suggestedBrands,
                        suggestedAction: matchedSignal.suggestedAction,
                      }
                    : undefined
                }
                isApproved={approvedRecs.has(rec.id)}
                isSkipped={skippedRecs.has(rec.id)}
                isPushing={pushingDraft === rec.id}
                pushResult={pushResult[rec.id]}
                editValues={editValues[rec.id]}
                isEditing={editingRec === rec.id}
                onEdit={startEditing}
                onSaveEdits={saveEdits}
                onCancelEdit={() => setEditingRec(null)}
                onUpdateEditField={updateEditField}
                onPushToDraft={requestPush}
                onSkip={handleSkip}
                onExpand={(recId) => trackExpand(recId)}
                onCollapse={(recId) => trackCollapse(recId)}
                onGuideOpen={(recId) => trackGuideOpen(recId)}
              />
            );
          })}
          {filteredRecs.length === 0 && (
            <div className="glass-card p-8 text-center">
              <Sparkles size={32} className="text-muted mx-auto mb-4" />
              <p className="text-sm text-muted">No recommendations for this filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog (#26) */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Craft Campaign Draft"
        message={`Create a draft campaign in ${confirmDialog.platform === "meta" ? "Meta" : "Google"} Ads?`}
        detail={confirmDialog.rec ? `${confirmDialog.rec.title} — ${editValues[confirmDialog.rec.id]?.budget || confirmDialog.rec.budget.suggested}, ${editValues[confirmDialog.rec.id]?.duration || confirmDialog.rec.budget.duration}` : ""}
        confirmLabel={`Craft for ${confirmDialog.platform === "meta" ? "Meta" : "Google"}`}
        onConfirm={executePush}
        onCancel={() => setConfirmDialog({ open: false, rec: null, platform: "meta" })}
      />
    </div>
  );
}
