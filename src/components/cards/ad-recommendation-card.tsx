"use client";

import { useState, useRef, useEffect } from "react";
import {
  Pencil,
  Check,
  X,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Target,
  BarChart3,
  Copy,
  AlertTriangle,
  Heart,
  Calendar,
  CloudRain,
  Trophy,
  Star,
  Briefcase,
  Gift,
  ShoppingBag,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { SuccessRing } from "@/components/ui/success-ring";
import { PredictionStrip } from "@/components/ui/prediction-strip";
import { SuggestedProducts } from "@/components/cards/suggested-products";

// ============================================================
// TYPES
// ============================================================

export interface AdRecommendation {
  id: string;
  signalId: string;
  signalTitle: string;
  signalType: string;
  priority: "urgent" | "high" | "medium" | "opportunity";
  title: string;
  description: string;
  creative: {
    direction: string;
    suggestedFormats: string[];
    brands: string[];
    sampleHeadlines: string[];
    samplePrimaryTexts: string[];
    cta: string;
  };
  targeting: {
    archetypes: string[];
    location: string;
    timing: string;
    platforms: { meta: string; google: string; reason: string };
  };
  budget: {
    suggested: string;
    duration: string;
    bidStrategy: string;
  };
  prediction: {
    confidence: number;
    estimatedReach: string;
    estimatedImpressions: string;
    estimatedClicks: string;
    estimatedCTR: string;
    estimatedConversions: string;
    estimatedCPA: string;
    estimatedRevenue: string;
    estimatedROAS: string;
    campaignGoal: string;
    factors: string[];
    methodology: string;
    profitProbability?: number;
    profitBreakdown?: {
      roasVsBreakeven: { weight: number; score: number; label: string };
      roi: { weight: number; score: number; label: string };
      signalConfidence: { weight: number; score: number; label: string };
      timingAlignment: { weight: number; score: number; label: string };
      cpaVsMargin: { weight: number; score: number; label: string };
    };
    estimatedROI?: string;
  };
  executionGuide: {
    meta: string;
    google: string;
  };
  indiaRelevance?: {
    score: "high" | "medium" | "low";
    note: string;
  };
}

export interface EditValues {
  budget: string;
  duration: string;
  bidStrategy: string;
  location: string;
  timing: string;
  headlines: string[];
  bodyTexts: string[];
  cta: string;
}

export interface SignalSource {
  dataSource?: string;
  sourceUrl?: string | null;
  detectedAt?: string;
  // Full signal data for the Signal Intelligence section
  title?: string;
  description?: string;
  type?: string;
  severity?: "critical" | "high" | "medium" | "low";
  confidence?: number;
  location?: string;
  targetArchetypes?: string[];
  suggestedBrands?: string[];
  suggestedAction?: string;
}

interface AdRecommendationCardProps {
  rec: AdRecommendation;
  recIndex: number;
  signalSource?: SignalSource;
  isApproved?: boolean;
  isSkipped?: boolean;
  isPushing?: boolean;
  pushResult?: { success: boolean; message: string; platform?: string } | null;
  editValues?: EditValues;
  onEdit: (rec: AdRecommendation) => void;
  onSaveEdits: (recId: string) => void;
  onCancelEdit: () => void;
  onUpdateEditField: (recId: string, field: string, value: string | string[]) => void;
  onPushToDraft: (rec: AdRecommendation, platform: "google" | "meta" | "both") => void;
  onSkip: (recId: string, reason: string) => void;
  onExpand?: (recId: string) => void;
  onCollapse?: (recId: string) => void;
  onGuideOpen?: (recId: string) => void;
  isEditing?: boolean;
  className?: string;
}

// ============================================================
// SIGNAL TYPE CONFIG (label + icon + color)
// ============================================================

const SIGNAL_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  weather: { label: "Weather", icon: CloudRain, color: "bg-blue-100 text-blue-700 border-blue-200" },
  search_trend: { label: "Trend", icon: Zap, color: "bg-purple-100 text-purple-700 border-purple-200" },
  festival: { label: "Festival", icon: Sparkles, color: "bg-pink-100 text-pink-700 border-pink-200" },
  salary_cycle: { label: "Salary/Economic", icon: Briefcase, color: "bg-green-100 text-green-700 border-green-200" },
  stock_market: { label: "Stock Market", icon: BarChart3, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cricket: { label: "Cricket", icon: Trophy, color: "bg-amber-100 text-amber-700 border-amber-200" },
  entertainment: { label: "Entertainment", icon: Star, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  ott_release: { label: "OTT Release", icon: Star, color: "bg-red-100 text-red-700 border-red-200" },
  celebrity: { label: "Celebrity", icon: Star, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  auspicious_day: { label: "Auspicious Day", icon: Sparkles, color: "bg-orange-100 text-orange-700 border-orange-200" },
  life_event: { label: "Life Event", icon: Heart, color: "bg-rose-100 text-rose-700 border-rose-200" },
  social_trend: { label: "Social Trend", icon: Zap, color: "bg-orange-100 text-orange-700 border-orange-200" },
  travel: { label: "Travel", icon: Calendar, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  regional: { label: "Regional", icon: Target, color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  inventory: { label: "Inventory", icon: ShoppingBag, color: "bg-orange-100 text-orange-700 border-orange-200" },
  competitor: { label: "Competitor", icon: Target, color: "bg-red-100 text-red-700 border-red-200" },
  economic: { label: "Economic", icon: Briefcase, color: "bg-green-100 text-green-700 border-green-200" },
  gift_occasion: { label: "Gift Occasion", icon: Gift, color: "bg-pink-100 text-pink-700 border-pink-200" },
  sale_event: { label: "Sale Event", icon: ShoppingBag, color: "bg-red-100 text-red-700 border-red-200" },
  occasion_dressing: { label: "Occasion", icon: Briefcase, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  fashion_event: { label: "Fashion Event", icon: Calendar, color: "bg-purple-100 text-purple-700 border-purple-200" },
  wedding: { label: "Wedding", icon: Heart, color: "bg-pink-100 text-pink-700 border-pink-200" },
  aesthetic: { label: "Aesthetic", icon: Sparkles, color: "bg-violet-100 text-violet-700 border-violet-200" },
  runway: { label: "Runway", icon: Zap, color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" },
  launch: { label: "Launch", icon: Zap, color: "bg-amber-100 text-amber-700 border-amber-200" },
  category_demand: { label: "Category", icon: BarChart3, color: "bg-blue-100 text-blue-700 border-blue-200" },
};

function getSignalConfig(type: string) {
  return SIGNAL_TYPE_CONFIG[type] || { label: type, icon: Zap, color: "bg-gray-100 text-gray-700 border-gray-200" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AdRecommendationCard({
  rec,
  recIndex,
  signalSource,
  isApproved = false,
  isSkipped = false,
  isPushing = false,
  pushResult,
  editValues,
  onEdit,
  onSaveEdits,
  onCancelEdit,
  onUpdateEditField,
  onPushToDraft,
  onSkip,
  onExpand,
  onCollapse,
  onGuideOpen,
  isEditing = false,
  className,
}: AdRecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleExpand = () => {
    if (expanded) {
      onCollapse?.(rec.id);
      setExpanded(false);
    } else {
      onExpand?.(rec.id);
      setExpanded(true);
      setGuideOpen(false);
    }
  };

  const toggleGuide = () => {
    if (guideOpen) {
      setGuideOpen(false);
    } else {
      onGuideOpen?.(rec.id);
      setGuideOpen(true);
      setExpanded(false);
    }
  };

  const signalConfig = getSignalConfig(rec.signalType);
  const SignalIcon = signalConfig.icon;

  return (
    <article
      className={cn(
        "bg-card rounded border border-card-border p-4 transition-all duration-200 card-enter hover:shadow-md",
        isApproved && "ring-2 ring-green-500",
        isSkipped && "opacity-40 hover:shadow-none",
        className
      )}
      aria-label={`Ad recommendation: ${rec.title}`}
    >
      {/* ── Header: Left badges + Right profit probability ── */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={rec.priority} />
          <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border", signalConfig.color)}>
            <SignalIcon size={12} aria-hidden="true" />
            {signalConfig.label}
          </span>
          {rec.indiaRelevance && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border",
                rec.indiaRelevance.score === "high" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                rec.indiaRelevance.score === "medium" && "bg-amber-100 text-amber-700 border-amber-200",
                rec.indiaRelevance.score === "low" && "bg-red-100 text-red-700 border-red-200"
              )}
            >
              {rec.indiaRelevance.score === "high" ? "Strong Signal" : rec.indiaRelevance.score === "low" ? "Weak Signal" : "Moderate Signal"}
            </span>
          )}
        </div>

        {/* Profit Probability — right aligned with hover tooltip */}
        <ProfitProbabilityBadge prediction={rec.prediction} />
      </div>

      {/* Title + Description */}
      <h3 className="font-semibold text-sm">{rec.title}</h3>
      {rec.description.includes("WHY THIS SIGNAL:") ? (
        <div className="text-xs text-muted mt-1">
          <p>{rec.description.split("WHY THIS SIGNAL:")[0].trim()}</p>
          <p className="mt-1 text-brand-blue font-medium">WHY THIS SIGNAL: <span className="text-muted font-normal">{rec.description.split("WHY THIS SIGNAL:")[1].trim()}</span></p>
        </div>
      ) : (
        <p className="text-xs text-muted mt-1">{rec.description}</p>
      )}

      {/* ── Signal Intelligence ── */}
      {signalSource?.title && (
        <SignalIntelligence signal={signalSource} signalType={rec.signalType} predictionFactors={rec.prediction.factors} methodology={rec.prediction.methodology} />
      )}

      {/* ── Budget & Duration — Inline Strip ── */}
      <div className="flex items-center gap-4 mt-4 border border-card-border rounded-lg px-4 py-2 bg-surface/40">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Budget:</span>
          <span className="text-sm font-bold text-brand-blue">
            {editValues?.budget || rec.budget.suggested}
          </span>
        </div>
        <span className="text-card-border">|</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Duration:</span>
          <span className="text-sm font-bold">
            {editValues?.duration || rec.budget.duration}
          </span>
        </div>
        {editValues && (
          <span className="text-xs text-brand-blue font-medium">(Customized)</span>
        )}
      </div>

      {/* ── Prediction Strip ── */}
      {!isEditing && (
        <PredictionStrip prediction={rec.prediction} className="mt-2" />
      )}

      {/* ── Suggested Products ── */}
      <SuggestedProducts recIndex={recIndex} />

      {/* ── Action Buttons — Card Footer (#23, #24, #25, #29) ── */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-card-border">
        {/* Left: Panel toggles */}
        <div className="flex gap-4">
          <button
            onClick={toggleExpand}
            className="flex items-center gap-1 text-xs text-brand-blue hover:underline"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide AI plan" : "Review AI plan"}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {expanded ? "Hide AI Plan" : "Review AI Plan"}
          </button>
          <button
            onClick={toggleGuide}
            className="flex items-center gap-1 text-xs text-muted hover:underline"
            aria-expanded={guideOpen}
            aria-label={guideOpen ? "Hide setup guide" : "Show setup guide"}
          >
            {guideOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {guideOpen ? "Hide Guide" : "Setup Guide"}
          </button>
        </div>

        {/* Right: Deploy + Dismiss buttons */}
        <div className="flex items-center gap-4">
          {!isApproved && !isSkipped && (
            <>
              {/* Deploy group */}
              {isPushing ? (
                <span className="text-xs text-brand-blue flex items-center gap-2 px-4 py-2">
                  <Loader2 size={14} className="animate-spin" /> Crafting draft...
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPushToDraft(rec, "meta")}
                    className="text-xs flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-blue text-brand-blue font-medium hover:bg-brand-blue hover:text-white transition-all duration-200"
                    aria-label={`Craft draft campaign for ${rec.title} in Meta Ads`}
                    title="Create a draft campaign in Meta Ads Manager"
                  >
                    Craft for Meta
                  </button>
                  <button
                    onClick={() => onPushToDraft(rec, "google")}
                    className="text-xs flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-blue text-brand-blue font-medium hover:bg-brand-blue hover:text-white transition-all duration-200"
                    aria-label={`Craft draft campaign for ${rec.title} in Google Ads`}
                    title="Create a draft campaign in Google Ads"
                  >
                    Craft for Google
                  </button>
                </div>
              )}

              {/* Dismiss group */}
              <SkipDropdown
                onSkip={(reason) => onSkip(rec.id, reason)}
                title={rec.title}
              />
            </>
          )}
          {isApproved && pushResult && (
            <span
              className={cn(
                "text-xs font-medium flex items-center gap-2 px-4 py-2 rounded-lg",
                pushResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              )}
            >
              {pushResult.success ? (
                <>
                  <Check size={14} /> Drafted to{" "}
                  {pushResult.platform === "meta" ? "Meta" : "Google"}
                </>
              ) : (
                <>
                  <AlertTriangle size={14} /> Failed
                </>
              )}
            </span>
          )}
          {isApproved && !pushResult && (
            <span className="text-xs font-medium text-green-700 bg-green-50 px-4 py-2 rounded-lg flex items-center gap-2">
              <Check size={14} /> Approved
            </span>
          )}
          {isSkipped && (
            <span className="text-xs text-muted bg-surface px-4 py-2 rounded-lg flex items-center gap-2">
              <X size={14} /> Skipped
            </span>
          )}
        </div>
      </div>

      {/* ── Expanded: Ad Plan (review + edit in one panel) ── */}
      {expanded && (
        <AdPlanPanel
          rec={rec}
          copiedText={copiedText}
          onCopy={copyToClipboard}
          editValues={editValues}
          onEdit={() => onEdit(rec)}
          onUpdate={onUpdateEditField}
          onSave={onSaveEdits}
          onCancel={onCancelEdit}
        />
      )}

      {/* ── Expanded: Setup Guide ── */}
      {guideOpen && (
        <SetupGuidePanel rec={rec} copiedText={copiedText} onCopy={copyToClipboard} />
      )}
    </article>
  );
}

// ============================================================
// EDIT PANEL
// ============================================================

const CTA_OPTIONS = [
  "Shop Now",
  "Learn More",
  "Sign Up",
  "Book Now",
  "Subscribe",
  "Contact Us",
  "Get Offer",
  "Apply Now",
  "Download",
] as const;

// ============================================================
// SIGNAL INTELLIGENCE
// ============================================================

function SignalIntelligence({ signal, signalType, predictionFactors, methodology }: { signal: SignalSource; signalType: string; predictionFactors?: string[]; methodology?: string }) {
  const [expanded, setExpanded] = useState(false);
  const config = getSignalConfig(signalType);
  const SignalIcon = config.icon;

  const severityStyle = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="mt-4 border border-card-border rounded-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 bg-surface/40 hover:bg-surface transition-colors text-left"
        aria-expanded={expanded}
        aria-label="Signal intelligence details"
      >
        <div className="flex items-center gap-2">
          <SignalIcon size={14} className={config.color.split(" ")[1]} aria-hidden="true" />
          <span className="text-xs font-semibold">Signal Intelligence</span>
          <span className="text-xs text-muted">— {signal.title}</span>
          {signal.severity && (
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border capitalize", severityStyle[signal.severity])}>
              {signal.severity}
            </span>
          )}
          {signal.confidence !== undefined && (
            <span className="text-xs text-muted">{Math.round(signal.confidence * 100)}% confidence</span>
          )}
        </div>
        {expanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 py-4 space-y-4 border-t border-card-border panel-expand">
          {/* Signal description */}
          {signal.description && (
            <div>
              <p className="text-xs font-medium text-muted mb-1">WHAT TRIGGERED THIS</p>
              <p className="text-xs">{signal.description}</p>
            </div>
          )}

          {/* Grid: Location + Detected + Source */}
          <div className="grid grid-cols-3 gap-4">
            {signal.location && (
              <div>
                <p className="text-xs font-medium text-muted mb-1">LOCATION</p>
                <p className="text-xs">{signal.location}</p>
              </div>
            )}
            {signal.detectedAt && (
              <div>
                <p className="text-xs font-medium text-muted mb-1">DETECTED</p>
                <p className="text-xs">{timeAgo(signal.detectedAt)}</p>
                <p className="text-xs text-muted">{new Date(signal.detectedAt).toLocaleString()}</p>
              </div>
            )}
            {signal.dataSource && (
              <div>
                <p className="text-xs font-medium text-muted mb-1">SOURCE</p>
                {signal.sourceUrl ? (
                  <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue hover:underline">
                    {signal.dataSource} ↗
                  </a>
                ) : (
                  <p className="text-xs">{signal.dataSource}</p>
                )}
              </div>
            )}
          </div>

          {/* Target Archetypes */}
          {signal.targetArchetypes && signal.targetArchetypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted mb-1">TARGET AUDIENCE</p>
              <div className="flex flex-wrap gap-1">
                {signal.targetArchetypes.map((a) => (
                  <span key={a} className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Brands */}
          {signal.suggestedBrands && signal.suggestedBrands.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted mb-1">SUGGESTED BRANDS</p>
              <div className="flex flex-wrap gap-1">
                {signal.suggestedBrands.map((b) => (
                  <span key={b} className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Action */}
          {signal.suggestedAction && (
            <div>
              <p className="text-xs font-medium text-muted mb-1">AI SUGGESTED ACTION</p>
              <p className="text-xs bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-green-800">{signal.suggestedAction}</p>
            </div>
          )}

          {/* Why this prediction — moved from PredictionStrip */}
          {predictionFactors && predictionFactors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted mb-1">WHY THIS PREDICTION</p>
              <div className="space-y-1">
                {predictionFactors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-brand-blue mt-0.5 shrink-0">•</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
              {methodology && (
                <p className="text-xs text-muted mt-2 italic">{methodology}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROFIT PROBABILITY BADGE WITH TOOLTIP
// ============================================================

function ProfitProbabilityBadge({ prediction }: { prediction: AdRecommendation["prediction"] }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const pp = prediction.profitProbability ?? prediction.confidence;
  const breakdown = prediction.profitBreakdown;
  const roi = prediction.estimatedROI;

  const badgeColor =
    pp >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    pp >= 60 ? "bg-blue-50 text-blue-700 border-blue-200" :
    pp >= 40 ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-red-50 text-red-700 border-red-200";

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className={cn("inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-bold border cursor-help transition-colors", badgeColor)}
        aria-label={`${pp}% profit probability — click for breakdown`}
        aria-expanded={showTooltip}
      >
        {pp}% Profit Probability
      </button>

      {/* Tooltip — opens left of badge, stays within card */}
      {showTooltip && breakdown && (
        <div className="absolute right-0 top-0 mt-8 w-72 bg-card border border-card-border rounded-lg shadow-2xl p-4 z-50 dropdown-enter">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold">PROFIT PROBABILITY</p>
            <span className={cn("text-sm font-bold", pp >= 80 ? "text-emerald-600" : pp >= 60 ? "text-blue-600" : "text-amber-600")}>{pp}%</span>
          </div>

          {[
            { key: "roas", name: "ROAS", score: breakdown.roasVsBreakeven.score, detail: breakdown.roasVsBreakeven.label },
            { key: "roi", name: "ROI", score: breakdown.roi.score, detail: breakdown.roi.label },
            { key: "signal", name: "Signal", score: breakdown.signalConfidence.score, detail: breakdown.signalConfidence.label },
            { key: "timing", name: "Timing", score: breakdown.timingAlignment.score, detail: breakdown.timingAlignment.label },
            { key: "cpa", name: "CPA", score: breakdown.cpaVsMargin.score, detail: breakdown.cpaVsMargin.label },
          ].map((f) => (
            <div key={f.key} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted w-12 shrink-0">{f.name}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                <div
                  className={cn("h-1.5 rounded-full", f.score >= 80 ? "bg-emerald-500" : f.score >= 60 ? "bg-blue-500" : f.score >= 40 ? "bg-amber-500" : "bg-red-400")}
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted w-8 text-right">{f.score}</span>
            </div>
          ))}

          {roi && (() => {
            const roiNum = parseInt(roi);
            const multiplier = (roiNum / 100 + 1).toFixed(1);
            return (
              <div className="border-t border-card-border pt-2 mt-1">
                <p className="text-xs font-semibold">Every ₹1 spent → ₹{multiplier} back</p>
                <p className="text-xs text-muted">Net ROI {roi} — after ad spend + 55% product margin</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function FieldInput({ label, value, onChange, helpText }: { label: string; value: string; onChange: (v: string) => void; helpText?: string }) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted block mb-1">
        {label.toUpperCase()}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs px-4 py-2 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
      />
      {helpText && (
        <p className="text-xs text-muted mt-1">{helpText}</p>
      )}
    </div>
  );
}

function SummaryField({ label, value, changed }: { label: string; value: string; changed: boolean }) {
  return (
    <div className={cn("flex items-start gap-2 px-4 py-2 rounded-lg text-xs", changed ? "bg-blue-50 border border-blue-200" : "bg-surface/50")}>
      <span className="text-muted shrink-0 w-20">{label}:</span>
      <span className={cn("flex-1", changed && "font-medium text-blue-700")}>{value}</span>
      {changed && <span className="text-blue-500 shrink-0 text-xs">edited</span>}
    </div>
  );
}

// ============================================================
// LIVE AD PREVIEW
// ============================================================

function AdPreview({
  headlines,
  bodyTexts,
  cta,
  brands,
  location,
}: {
  headlines: string[];
  bodyTexts: string[];
  cta: string;
  brands: string[];
  location: string;
}) {
  const [variationIndex, setVariationIndex] = useState(0);
  const [platform, setPlatform] = useState<"meta" | "google">("meta");
  const maxIndex = Math.max(headlines.length, bodyTexts.length) - 1;
  const currentHeadline = headlines[variationIndex] || headlines[0] || "";
  const currentBody = bodyTexts[variationIndex] || bodyTexts[0] || "";
  const displayUrl = brands[0] ? `ajioluxe.com/${brands[0].toLowerCase().replace(/\s+/g, "-")}` : "ajioluxe.com";

  const prev = () => setVariationIndex((i) => Math.max(0, i - 1));
  const next = () => setVariationIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <div className="sticky top-4">
      {/* Header: Platform tabs + Variation switcher */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
          <button
            onClick={() => setPlatform("meta")}
            className={cn(
              "text-xs font-medium px-4 py-1 rounded-md transition-colors",
              platform === "meta" ? "bg-white text-brand-blue shadow-sm" : "text-muted hover:text-text"
            )}
            aria-label="Preview as Meta ad"
          >
            Meta
          </button>
          <button
            onClick={() => setPlatform("google")}
            className={cn(
              "text-xs font-medium px-4 py-1 rounded-md transition-colors",
              platform === "google" ? "bg-white text-green-600 shadow-sm" : "text-muted hover:text-text"
            )}
            aria-label="Preview as Google ad"
          >
            Google
          </button>
        </div>
        {maxIndex > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={prev} disabled={variationIndex === 0}
              className={cn("p-1 rounded transition-colors", variationIndex === 0 ? "text-muted/30" : "text-muted hover:text-text hover:bg-surface")}
              aria-label="Previous variation">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-muted tabular-nums">{variationIndex + 1}/{maxIndex + 1}</span>
            <button onClick={next} disabled={variationIndex === maxIndex}
              className={cn("p-1 rounded transition-colors", variationIndex === maxIndex ? "text-muted/30" : "text-muted hover:text-text hover:bg-surface")}
              aria-label="Next variation">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── META: Instagram Feed Mockup ── */}
      {platform === "meta" && (
        <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden w-full">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center">
              <span className="text-white text-xs font-bold">{brands[0]?.[0] || "A"}</span>
            </div>
            <div>
              <p className="text-xs font-semibold">{brands[0] || "Brand"}</p>
              <p className="text-xs text-muted">Sponsored · {location.split(",")[0]?.trim() || "India"}</p>
            </div>
          </div>
          <div className="px-4 py-2">
            <p className="text-xs leading-relaxed">{currentBody || "Your ad body text will appear here..."}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-1">
                <Sparkles size={18} className="text-muted" />
              </div>
              <p className="text-xs text-muted">Ad Creative</p>
            </div>
          </div>
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted uppercase tracking-wide">{brands.join(" · ")}</p>
                <p className="text-sm font-semibold truncate mt-0.5">{currentHeadline || "Your headline here..."}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold bg-brand-blue text-white px-4 py-2 rounded-lg">{cta || "Shop Now"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100">
            <Heart size={14} className="text-muted" />
            <span className="text-xs text-muted">Like</span>
            <span className="text-xs text-muted ml-auto">Comment</span>
            <span className="text-xs text-muted">Share</span>
          </div>
        </div>
      )}

      {/* ── GOOGLE: Search Ad Mockup ── */}
      {platform === "google" && (
        <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden w-full p-4">
          {/* Sponsored label */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-text">Sponsored</span>
          </div>
          {/* Display URL */}
          <div className="flex items-center gap-1 mb-1">
            <div className="w-5 h-5 rounded-full bg-surface flex items-center justify-center">
              <span className="text-xs font-bold text-brand-blue">{brands[0]?.[0] || "A"}</span>
            </div>
            <div>
              <p className="text-xs font-medium">{brands[0] || "Brand"}</p>
              <p className="text-xs text-green-700">{displayUrl}</p>
            </div>
          </div>
          {/* Headlines */}
          <p className="text-brand-blue text-sm font-medium leading-snug hover:underline cursor-pointer">
            {currentHeadline || "Your headline here..."}{headlines[1] ? ` | ${headlines[1]}` : ""}
          </p>
          {/* Description */}
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            {currentBody || "Your ad description will appear here..."}
          </p>
          {/* Sitelinks mock */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-brand-blue hover:underline cursor-pointer">{cta || "Shop Now"}</span>
            <span className="text-xs text-brand-blue hover:underline cursor-pointer">View Collection</span>
            <span className="text-xs text-brand-blue hover:underline cursor-pointer">Free Delivery</span>
          </div>
        </div>
      )}

      <p className="text-xs text-muted mt-2 text-center">
        {platform === "meta" ? "Instagram Feed" : "Google Search"} preview · Updates live as you type
      </p>
    </div>
  );
}

// ============================================================
// AD PLAN PANEL
// ============================================================

function AdPlanPanel({
  rec,
  copiedText,
  onCopy,
  editValues,
  onEdit,
  onUpdate,
  onSave,
  onCancel,
}: {
  rec: AdRecommendation;
  copiedText: string | null;
  onCopy: (text: string, label: string) => void;
  editValues?: EditValues;
  onEdit: () => void;
  onUpdate: (recId: string, field: string, value: string | string[]) => void;
  onSave: (recId: string) => void;
  onCancel: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const values = editValues;

  const isDirty = values ? (
    values.budget !== rec.budget.suggested ||
    values.duration !== rec.budget.duration ||
    values.bidStrategy !== rec.budget.bidStrategy ||
    values.location !== rec.targeting.location ||
    values.timing !== rec.targeting.timing ||
    values.cta !== rec.creative.cta ||
    values.headlines.some((h, i) => h !== rec.creative.sampleHeadlines[i]) ||
    values.bodyTexts.some((t, i) => t !== rec.creative.samplePrimaryTexts[i])
  ) : false;

  const startEditing = () => {
    onEdit(); // initializes editValues in the page
    setEditing(true);
    setSaved(false);
  };

  const handleSave = () => {
    if (!isDirty) {
      // Nothing changed — just go back to read mode
      setEditing(false);
      return;
    }
    onSave(rec.id);
    setSaved(true);
    setEditing(false);
  };

  const handleCancel = () => {
    if (isDirty && !saved) {
      setShowDiscardDialog(true);
    } else {
      setEditing(false);
      onCancel();
    }
  };

  // ── SAVED SUMMARY MODE ──
  if (saved && values) {
    return (
      <div className="border-t border-card-border bg-surface/50 p-4 mt-4 -mx-4 -mb-4 rounded-b panel-expand">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold flex items-center gap-2 text-green-700">
            <Check size={12} /> CUSTOMIZATION SAVED
          </h4>
          <button onClick={() => { setSaved(false); setEditing(true); }} className="text-xs text-brand-blue hover:underline">
            Back to editing
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <SummaryField label="Budget" value={values.budget} changed={values.budget !== rec.budget.suggested} />
          <SummaryField label="Duration" value={values.duration} changed={values.duration !== rec.budget.duration} />
          <SummaryField label="Bid Strategy" value={values.bidStrategy} changed={values.bidStrategy !== rec.budget.bidStrategy} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <SummaryField label="Location" value={values.location} changed={values.location !== rec.targeting.location} />
          <SummaryField label="Timing" value={values.timing} changed={values.timing !== rec.targeting.timing} />
        </div>
        <div className="mb-4">
          <p className="text-xs font-medium text-muted mb-1">HEADLINES</p>
          <div className="space-y-1">
            {values.headlines.map((h, i) => (
              <SummaryField key={i} label={`Variation ${i + 1}`} value={h} changed={h !== rec.creative.sampleHeadlines[i]} />
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs font-medium text-muted mb-1">BODY TEXT</p>
          <div className="space-y-1">
            {values.bodyTexts.map((t, i) => (
              <SummaryField key={i} label={`Variation ${i + 1}`} value={t} changed={t !== rec.creative.samplePrimaryTexts[i]} />
            ))}
          </div>
        </div>
        <SummaryField label="CTA" value={values.cta} changed={values.cta !== rec.creative.cta} />

        <p className="text-xs text-muted mt-4 pt-4 border-t border-card-border">
          Your customizations are saved. Use the "Craft for Meta" or "Craft for Google" buttons above to push.
        </p>
      </div>
    );
  }

  // ── EDIT MODE ──
  if (editing && values) {
    return (
      <>
        <div className="border-t border-card-border bg-surface/50 p-4 mt-4 -mx-4 -mb-4 rounded-b panel-expand">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-semibold flex items-center gap-2">
                <Pencil size={12} className="text-brand-blue" /> EDITING AI-GENERATED PLAN
              </h4>
              <p className="text-xs text-muted mt-0.5">Modify any field below. Your changes will be applied when you push.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCancel} className="text-xs text-muted hover:text-text" aria-label="Cancel editing">Cancel</button>
              <button onClick={handleSave} className="btn-approve flex items-center gap-1 text-xs" aria-label="Save changes">
                <Check size={12} /> Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_320px] gap-8">
            {/* Edit form */}
            <div className="space-y-4">
              <fieldset className="border border-card-border rounded-lg p-4">
                <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Campaign Settings</legend>
                <div className="grid grid-cols-3 gap-4">
                  <FieldInput label="Budget" value={values.budget} onChange={(v) => onUpdate(rec.id, "budget", v)} helpText="Daily spend in INR" />
                  <FieldInput label="Duration" value={values.duration} onChange={(v) => onUpdate(rec.id, "duration", v)} helpText="Campaign flight length" />
                  <FieldInput label="Bid Strategy" value={values.bidStrategy} onChange={(v) => onUpdate(rec.id, "bidStrategy", v)} helpText="Cost Cap / Target ROAS" />
                </div>
              </fieldset>

              <fieldset className="border border-card-border rounded-lg p-4">
                <legend className="text-xs font-semibold text-brand-orange px-2 uppercase tracking-wide">Targeting</legend>
                <div className="grid grid-cols-2 gap-4">
                  <FieldInput label="Location" value={values.location} onChange={(v) => onUpdate(rec.id, "location", v)} helpText="Comma-separated city names" />
                  <FieldInput label="Timing" value={values.timing} onChange={(v) => onUpdate(rec.id, "timing", v)} helpText="e.g., Evening 7-11 PM" />
                </div>
              </fieldset>

              <fieldset className="border border-card-border rounded-lg p-4">
                <legend className="text-xs font-semibold text-brand-purple px-2 uppercase tracking-wide">Creative</legend>
                <div className="mb-4">
                  <label className="text-xs font-medium text-muted block mb-1">HEADLINES</label>
                  <p className="text-xs text-muted mb-2">All variations are sent to Meta/Google — the platform auto-tests to find the best performer.</p>
                  <div className="space-y-2">
                    {values.headlines.map((h, i) => {
                      const charCount = h.length;
                      const charPct = charCount / 40;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-muted shrink-0 w-20">Variation {i + 1}</span>
                          <div className="relative flex-1">
                            <input type="text" value={h}
                              onChange={(e) => { const u = [...values.headlines]; u[i] = e.target.value; onUpdate(rec.id, "headlines", u); }}
                              placeholder={`Headline variation ${i + 1}`} aria-label={`Headline variation ${i + 1}`}
                              className={cn("w-full text-xs px-4 py-2 rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue pr-28", charPct > 1 ? "border-red-300" : "border-card-border")}
                            />
                            <span className={cn("absolute right-4 top-1/2 -translate-y-1/2 text-xs tabular-nums", charPct > 1 ? "text-red-500 font-medium" : charPct >= 0.8 ? "text-amber-500" : "text-muted")}>{charCount}/40</span>
                          </div>
                          {values.headlines.length > 1 && (
                            <button onClick={() => onUpdate(rec.id, "headlines", values.headlines.filter((_, idx) => idx !== i))} className="text-muted/40 hover:text-red-500 transition-colors shrink-0" aria-label={`Remove headline ${i + 1}`}><X size={14} /></button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {values.headlines.length < 5 && (
                    <button onClick={() => onUpdate(rec.id, "headlines", [...values.headlines, ""])} className="flex items-center gap-1 text-xs text-brand-blue hover:underline mt-2"><Plus size={12} /> Add variation</button>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium text-muted block mb-1">BODY TEXT</label>
                  <p className="text-xs text-muted mb-2">All variations are sent to the platform for auto-testing.</p>
                  <div className="space-y-2">
                    {values.bodyTexts.map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs text-muted shrink-0 w-20 mt-2">Variation {i + 1}</span>
                        <textarea value={t}
                          onChange={(e) => { const u = [...values.bodyTexts]; u[i] = e.target.value; onUpdate(rec.id, "bodyTexts", u); }}
                          rows={2} placeholder={`Body text variation ${i + 1}`} aria-label={`Body text variation ${i + 1}`}
                          className="flex-1 text-xs px-4 py-2 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none"
                        />
                        {values.bodyTexts.length > 1 && (
                          <button onClick={() => onUpdate(rec.id, "bodyTexts", values.bodyTexts.filter((_, idx) => idx !== i))} className="text-muted/40 hover:text-red-500 transition-colors shrink-0 mt-2" aria-label={`Remove body text ${i + 1}`}><X size={14} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  {values.bodyTexts.length < 5 && (
                    <button onClick={() => onUpdate(rec.id, "bodyTexts", [...values.bodyTexts, ""])} className="flex items-center gap-1 text-xs text-brand-blue hover:underline mt-2"><Plus size={12} /> Add variation</button>
                  )}
                </div>

                <div className="w-48">
                  <label htmlFor="field-cta-plan" className="text-xs font-medium text-muted block mb-1">CTA BUTTON</label>
                  <select id="field-cta-plan" value={values.cta} onChange={(e) => onUpdate(rec.id, "cta", e.target.value)}
                    className="w-full text-xs px-4 py-2 rounded-lg border border-card-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue appearance-none cursor-pointer" aria-label="Call to action button">
                    {CTA_OPTIONS.map((cta) => (<option key={cta} value={cta}>{cta}</option>))}
                  </select>
                </div>
              </fieldset>
            </div>

            {/* Live preview */}
            <div className="flex flex-col gap-4">
              <AdPreview headlines={values.headlines} bodyTexts={values.bodyTexts} cta={values.cta} brands={rec.creative.brands} location={values.location} />
            </div>
          </div>
        </div>

        {showDiscardDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Discard changes">
            <div className="absolute inset-0 bg-black/30 dialog-overlay" onClick={() => setShowDiscardDialog(false)} aria-hidden="true" />
            <div className="relative bg-card rounded-lg border border-card-border shadow-xl p-4 w-full max-w-sm dialog-content">
              <h3 className="text-sm font-semibold mb-1">Discard changes?</h3>
              <p className="text-xs text-muted mb-4">Your edits will be lost.</p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowDiscardDialog(false)} className="btn-secondary text-xs">Keep Editing</button>
                <button onClick={() => { setShowDiscardDialog(false); setEditing(false); onCancel(); }} className="btn-reject text-xs">Discard</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── READ MODE (default) ──
  return (
    <div className="border-t border-card-border bg-surface/50 p-4 mt-4 -mx-4 -mb-4 rounded-b panel-expand space-y-4">
      {/* Header with Edit button */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-brand-purple flex items-center gap-1">
          <Sparkles size={12} /> AI-GENERATED AD PLAN
        </h4>
        <button
          onClick={startEditing}
          className="text-xs text-brand-purple font-medium hover:underline flex items-center gap-1 px-4 py-2 rounded-lg border border-card-border hover:bg-surface transition-colors"
          aria-label="Edit this plan"
        >
          <Pencil size={10} /> Edit this plan
        </button>
      </div>

      {/* Creative */}
      <div>
        <h4 className="text-xs font-semibold text-brand-purple mb-2 flex items-center gap-1">
          <Sparkles size={12} /> CREATIVE DIRECTION
        </h4>
        <p className="text-xs text-text-secondary mb-2">{rec.creative.direction}</p>
        <div className="mb-2">
          <span className="text-xs text-muted block mb-1">Formats</span>
          <div className="flex flex-wrap gap-1">
            {rec.creative.suggestedFormats.map((f) => (
              <span key={f} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{f}</span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted block mb-1">Brands</span>
          <div className="flex flex-wrap gap-1">
            {rec.creative.brands.map((b) => (
              <span key={b} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{b}</span>
            ))}
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border border-card-border">
          <p className="text-xs font-medium text-muted mb-2">COPY-READY AD TEXT (click to copy)</p>
          {rec.creative.sampleHeadlines.map((h, i) => (
            <CopyableRow key={`h-${i}`} label={`Headline ${i + 1}`} value={h} copyKey={`headline-${i}`} copiedText={copiedText} onCopy={onCopy} isBold charLimit={40} />
          ))}
          {rec.creative.samplePrimaryTexts.map((t, i) => (
            <CopyableRow key={`b-${i}`} label={`Body ${i + 1}`} value={t} copyKey={`body-${i}`} copiedText={copiedText} onCopy={onCopy} className="mt-2" />
          ))}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted w-20">CTA:</span>
            <span className="text-xs font-medium bg-brand-blue text-white px-2 py-0.5 rounded">{rec.creative.cta}</span>
          </div>
        </div>
      </div>

      {/* Targeting */}
      <div>
        <h4 className="text-xs font-semibold text-brand-orange mb-2 flex items-center gap-1">
          <Target size={12} /> TARGETING
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-xs font-medium text-muted mb-1">ARCHETYPES</p><p className="text-xs">{rec.targeting.archetypes.join(", ")}</p></div>
          <div><p className="text-xs font-medium text-muted mb-1">LOCATION</p><p className="text-xs">{rec.targeting.location}</p></div>
          <div><p className="text-xs font-medium text-muted mb-1">TIMING</p><p className="text-xs">{rec.targeting.timing}</p></div>
        </div>
      </div>

      {/* Platform & Budget */}
      <div>
        <h4 className="text-xs font-semibold text-brand-blue mb-2 flex items-center gap-1">
          <BarChart3 size={12} /> PLATFORM & BUDGET
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-2 bg-white rounded-lg border border-card-border">
            <p className="text-xs font-medium">Meta: {rec.targeting.platforms.meta}</p>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: rec.targeting.platforms.meta }} />
            </div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-card-border">
            <p className="text-xs font-medium">Google: {rec.targeting.platforms.google}</p>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: rec.targeting.platforms.google }} />
            </div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-card-border">
            <p className="text-xs font-bold">{rec.budget.suggested}</p>
            <p className="text-xs text-muted">{rec.budget.duration}</p>
            <p className="text-xs text-muted">{rec.budget.bidStrategy}</p>
          </div>
        </div>
        {rec.targeting.platforms.reason && (
          <p className="text-xs text-muted mt-2 italic">{rec.targeting.platforms.reason}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SETUP GUIDE PANEL
// ============================================================

function SetupGuidePanel({ rec, copiedText, onCopy }: { rec: AdRecommendation; copiedText: string | null; onCopy: (text: string, label: string) => void }) {
  return (
    <div className="border-t border-card-border bg-navy/5 p-4 mt-4 -mx-4 -mb-4 rounded-b space-y-4 panel-expand">
      <h4 className="text-xs font-semibold text-brand-purple flex items-center gap-1">
        <Sparkles size={12} /> SETUP GUIDE
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <GuideBlock title="META ADS MANAGER" borderColor="border-l-blue-500" content={rec.executionGuide.meta} copyKey={`meta-guide-${rec.id}`} copiedText={copiedText} onCopy={onCopy} />
        <GuideBlock title="GOOGLE ADS" borderColor="border-l-green-500" content={rec.executionGuide.google} copyKey={`google-guide-${rec.id}`} copiedText={copiedText} onCopy={onCopy} />
      </div>
    </div>
  );
}

function parseGuideSteps(content: string): { num: string; label: string; value: string }[] {
  return content
    .split("\n")
    .filter((line) => /^\d+\./.test(line.trim()))
    .map((line) => {
      const match = line.trim().match(/^(\d+)\.\s*([^:]+):\s*(.+)$/);
      if (match) {
        return { num: match[1], label: match[2].trim(), value: match[3].trim() };
      }
      const fallback = line.trim().match(/^(\d+)\.\s*(.+)$/);
      return { num: fallback?.[1] || "•", label: "", value: fallback?.[2] || line.trim() };
    });
}

function GuideBlock({ title, borderColor, content, copyKey, copiedText, onCopy }: { title: string; borderColor: string; content: string; copyKey: string; copiedText: string | null; onCopy: (text: string, label: string) => void }) {
  const steps = parseGuideSteps(content);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold">{title}</p>
        <button onClick={() => onCopy(content, copyKey)} className="text-xs text-brand-blue hover:underline flex items-center gap-1" aria-label={`Copy ${title} steps`}>
          <Copy size={12} /> {copiedText === copyKey ? "Copied!" : "Copy steps"}
        </button>
      </div>
      <div className="bg-white rounded-lg border border-card-border overflow-hidden">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-4 px-4 py-2",
              i < steps.length - 1 && "border-b border-card-border/50",
              i % 2 === 1 && "bg-surface/30"
            )}
          >
            <span className="text-xs font-bold text-muted w-5 shrink-0 mt-0.5">{step.num}</span>
            {step.label ? (
              <>
                <span className="text-xs font-semibold w-24 shrink-0 mt-0.5">{step.label}</span>
                <span className="text-xs text-text-secondary">{step.value}</span>
              </>
            ) : (
              <span className="text-xs text-text-secondary">{step.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COPYABLE ROW
// ============================================================

function CopyableRow({ label, value, copyKey, copiedText, onCopy, isBold, charLimit, className }: { label: string; value: string; copyKey: string; copiedText: string | null; onCopy: (text: string, label: string) => void; isBold?: boolean; charLimit?: number; className?: string }) {
  const charCount = value.length;
  const charPct = charLimit ? charCount / charLimit : 0;

  return (
    <div
      className={cn("flex items-center gap-2 mb-1 group cursor-pointer rounded px-2 py-1 -mx-2 hover:bg-surface transition-colors", className)}
      onClick={() => onCopy(value, copyKey)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCopy(value, copyKey); } }}
      aria-label={`Copy ${label}: ${value}`}
    >
      <span className="text-xs text-muted w-20 shrink-0">{label}:</span>
      <span className={cn("text-xs flex-1", isBold ? "font-medium" : "text-text-secondary")}>{value}</span>
      {charLimit && (
        <span className={cn(
          "text-xs shrink-0 tabular-nums",
          charPct > 1 ? "text-red-500 font-medium" : charPct >= 0.8 ? "text-amber-500" : "text-muted"
        )}>
          {charCount} of {charLimit} chars
        </span>
      )}
      <Copy size={12} className={cn("text-muted group-hover:text-brand-blue shrink-0", copiedText === copyKey && "text-brand-green")} />
      {copiedText === copyKey && <span className="text-xs text-brand-green">Copied!</span>}
    </div>
  );
}

// ============================================================
// SKIP DROPDOWN
// ============================================================

const SKIP_REASONS = [
  "Not relevant to current strategy",
  "Budget already allocated elsewhere",
  "Signal too weak / low confidence",
  "Already running a similar campaign",
  "Wrong timing — revisit later",
  "Wrong audience for our brand",
  "Other",
] as const;

function SkipDropdown({
  onSkip,
  title,
}: {
  onSkip: (reason: string) => void;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-muted/60 hover:text-red-500 px-2 py-2 rounded-lg transition-colors flex items-center gap-1"
        aria-label={`Skip recommendation: ${title}`}
        aria-expanded={open}
        aria-haspopup="true"
        title="Dismiss this recommendation"
      >
        Skip
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-full mb-1 w-64 bg-card border border-card-border rounded-lg shadow-lg py-1 z-10 dropdown-enter"
          role="menu"
          aria-label="Skip reasons"
        >
          <p className="px-4 py-2 text-xs font-medium text-muted border-b border-card-border">
            Why are you skipping this?
          </p>
          {SKIP_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => {
                onSkip(reason);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs text-text hover:bg-surface transition-colors"
              role="menuitem"
            >
              {reason}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
