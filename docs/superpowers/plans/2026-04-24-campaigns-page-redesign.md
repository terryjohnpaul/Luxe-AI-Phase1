# Campaigns Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the campaigns listing page from a flat dark-themed data table into a CMO-oriented "war room" with performance pulse, health-based swim lanes, and full design system alignment.

**Architecture:** Break the monolithic 1636-line page into focused components. Add a health classification layer that groups campaigns by business health (needs attention / top performers / monitoring / paused). Extend the API to support date range filtering and return aggregate performance stats. Migrate all styling from hardcoded dark theme to the app's light design system tokens.

**Tech Stack:** Next.js 15 (App Router), React, Tailwind CSS v4 (with `@theme` tokens), existing shared components (`StatCard`, `PageHeader`, `ToastProvider`, `ConfirmDialog`, `cn()`).

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/campaigns/health.ts` | Campaign health classification logic + aggregate stat computation |
| Create | `src/lib/campaigns/formatters.ts` | INR currency, number, and percentage formatters |
| Create | `src/components/campaigns/performance-pulse.tsx` | 6 stat cards showing aggregate financial metrics |
| Create | `src/components/campaigns/filters-bar.tsx` | Platform filter, date range toggle, search, sort controls |
| Create | `src/components/campaigns/campaign-card.tsx` | Single campaign card with 3 hero metrics + expandable details |
| Create | `src/components/campaigns/health-board.tsx` | Swim lane grouping: needs attention / top performers / monitoring / paused |
| Create | `src/components/campaigns/campaign-edit-panel.tsx` | 3-tab edit panel (Campaign / Ad Sets / Ads) with design system styling |
| Create | `src/components/campaigns/campaign-analyze-panel.tsx` | AI analysis panel restyled to light theme |
| Rewrite | `src/app/dashboard/campaigns/page.tsx` | Slim orchestrator page wiring all components together |
| Modify | `src/app/api/campaigns/route.ts` | Add `dateRange` param + return aggregate stats in response |

---

## Task 1: Formatters & Health Classification Utilities

**Files:**
- Create: `src/lib/campaigns/formatters.ts`
- Create: `src/lib/campaigns/health.ts`

- [ ] **Step 1: Create formatters utility**

```typescript
// src/lib/campaigns/formatters.ts

export const fmtINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);

export const fmtNum = (v: number) =>
  new Intl.NumberFormat("en-IN").format(Math.round(v));

export const fmtPct = (v: number) => `${v.toFixed(2)}%`;

export const fmtROAS = (v: number) => (v > 0 ? `${v.toFixed(1)}x` : "--");

export const safe = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? 0 : n;
};
```

- [ ] **Step 2: Create health classification utility**

```typescript
// src/lib/campaigns/health.ts

import type { Campaign } from "@/app/dashboard/campaigns/page";

export type HealthLane = "needs_attention" | "top_performers" | "monitoring" | "paused";

export interface HealthGroup {
  lane: HealthLane;
  label: string;
  color: "red" | "green" | "orange" | "navy";
  campaigns: Campaign[];
  totalSpend: number;
}

export interface AggregateStats {
  totalSpend: number;
  blendedROAS: number;
  totalConversions: number;
  avgCPA: number;
  totalRevenue: number;
  activeCampaigns: number;
  totalCampaigns: number;
}

export function computeAggregateStats(campaigns: Campaign[]): AggregateStats {
  const active = campaigns.filter((c) => c.status === "ACTIVE");
  const totalSpend = campaigns.reduce((s, c) => s + (c.metrics?.spend || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + (c.metrics?.conversionValue || 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + (c.metrics?.conversions || 0), 0);

  return {
    totalSpend,
    blendedROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    totalConversions,
    avgCPA: totalConversions > 0 ? totalSpend / totalConversions : 0,
    totalRevenue,
    activeCampaigns: active.length,
    totalCampaigns: campaigns.length,
  };
}

export function classifyCampaigns(campaigns: Campaign[]): HealthGroup[] {
  const active = campaigns.filter((c) => c.status === "ACTIVE");
  const paused = campaigns.filter((c) => c.status !== "ACTIVE");

  // Compute average CPA across all active campaigns with conversions
  const withConversions = active.filter((c) => (c.metrics?.conversions || 0) > 0);
  const avgCPA =
    withConversions.length > 0
      ? withConversions.reduce((s, c) => s + (c.metrics?.cpa || 0), 0) / withConversions.length
      : 0;

  const needsAttention: Campaign[] = [];
  const topPerformers: Campaign[] = [];
  const monitoring: Campaign[] = [];

  for (const c of active) {
    const roas = c.metrics?.roas || 0;
    const cpa = c.metrics?.cpa || 0;
    const spend = c.metrics?.spend || 0;

    // Needs Attention: ROAS < 1x OR CPA > 2x average (only if campaign has spend)
    if (spend > 0 && (roas < 1 || (avgCPA > 0 && cpa > avgCPA * 2))) {
      needsAttention.push(c);
    }
    // Top Performers: ROAS >= 3x AND CPA <= average
    else if (roas >= 3 && (avgCPA === 0 || cpa <= avgCPA)) {
      topPerformers.push(c);
    }
    // Everything else
    else {
      monitoring.push(c);
    }
  }

  const sumSpend = (arr: Campaign[]) => arr.reduce((s, c) => s + (c.metrics?.spend || 0), 0);

  return [
    {
      lane: "needs_attention",
      label: "Needs Attention",
      color: "red",
      campaigns: needsAttention,
      totalSpend: sumSpend(needsAttention),
    },
    {
      lane: "top_performers",
      label: "Top Performers",
      color: "green",
      campaigns: topPerformers,
      totalSpend: sumSpend(topPerformers),
    },
    {
      lane: "monitoring",
      label: "Monitoring",
      color: "orange",
      campaigns: monitoring,
      totalSpend: sumSpend(monitoring),
    },
    {
      lane: "paused",
      label: "Paused",
      color: "navy",
      campaigns: paused,
      totalSpend: sumSpend(paused),
    },
  ];
}

export function getHealthDot(campaign: Campaign, avgCPA: number): "red" | "amber" | "green" | "gray" {
  if (campaign.status !== "ACTIVE") return "gray";
  const roas = campaign.metrics?.roas || 0;
  const cpa = campaign.metrics?.cpa || 0;
  const spend = campaign.metrics?.spend || 0;
  if (spend > 0 && (roas < 1 || (avgCPA > 0 && cpa > avgCPA * 2))) return "red";
  if (roas >= 3 && (avgCPA === 0 || cpa <= avgCPA)) return "green";
  return "amber";
}
```

- [ ] **Step 3: Verify files compile**

Run: `cd /Users/terrypaul/Desktop/Phase_1/luxe-ai && npx tsc --noEmit src/lib/campaigns/formatters.ts src/lib/campaigns/health.ts 2>&1 | head -20`

Note: The Campaign type import in health.ts will resolve after we export it from the page. For now verify no syntax errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/campaigns/formatters.ts src/lib/campaigns/health.ts
git commit -m "feat(campaigns): add health classification and formatter utilities"
```

---

## Task 2: Extend API to Support Date Range + Aggregate Stats

**Files:**
- Modify: `src/app/api/campaigns/route.ts`

The API currently hardcodes `date_preset=last_7d`. We need to accept a `dateRange` query param and return aggregate performance stats.

- [ ] **Step 1: Add dateRange param mapping**

In `src/app/api/campaigns/route.ts`, in the `GET` handler, after the existing `searchParams` parsing (around line 233), add:

```typescript
const dateRange = searchParams.get("dateRange") || "last_7d";
```

- [ ] **Step 2: Pass dateRange to Meta API insights URL**

In the `fetchLiveMetaCampaigns` function, change the function signature and insights URL.

Replace the function signature (line 134):
```typescript
async function fetchLiveMetaCampaigns(token: string, accountId: string, statusFilter?: string): Promise<MergedCampaign[]> {
```
With:
```typescript
async function fetchLiveMetaCampaigns(token: string, accountId: string, statusFilter?: string, dateRange: string = "last_7d"): Promise<MergedCampaign[]> {
```

Replace the `date_preset=last_7d` in the insights URL (line 158):
```typescript
    `&date_preset=last_7d` +
```
With:
```typescript
    `&date_preset=${dateRange}` +
```

- [ ] **Step 3: Pass dateRange through to the function call**

In the `GET` handler, update the call to `fetchLiveMetaCampaigns` (around line 254). Replace:
```typescript
      allCampaigns = await fetchLiveMetaCampaigns(token, accountId, statusFilter);
```
With:
```typescript
      allCampaigns = await fetchLiveMetaCampaigns(token, accountId, statusFilter, dateRange);
```

- [ ] **Step 4: Update the cache key to include dateRange**

Replace line 245:
```typescript
    const cacheKey = `${CACHE_KEY}:${account}:${statusFilter}`;
```
With:
```typescript
    const cacheKey = `${CACHE_KEY}:${account}:${statusFilter}:${dateRange}`;
```

- [ ] **Step 5: Add aggregate stats to the API response**

In the GET handler, after the stats computation (around line 280), add aggregate metrics before the return statement. Replace the return block (lines 286-299):

```typescript
    // Compute aggregate performance metrics
    const totalConversions = filtered.reduce((s, c) => s + c.metrics.conversions, 0);
    const totalRevenue = filtered.reduce((s, c) => s + c.metrics.conversionValue, 0);
    const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;

    return NextResponse.json({
      campaigns: paginated,
      stats: {
        total,
        meta: total,
        google: 0,
        active: activeCount,
        paused: pausedCount,
        totalSpend,
        totalPages,
        accountName,
        accountId,
        // New aggregate stats
        totalConversions,
        totalRevenue,
        blendedROAS,
        avgCPA,
      },
    });
```

- [ ] **Step 6: Verify API compiles**

Run: `cd /Users/terrypaul/Desktop/Phase_1/luxe-ai && npx next build --no-lint 2>&1 | tail -20`

If build takes too long, just verify with: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 7: Commit**

```bash
git add src/app/api/campaigns/route.ts
git commit -m "feat(campaigns-api): add dateRange param and aggregate performance stats"
```

---

## Task 3: Performance Pulse Component

**Files:**
- Create: `src/components/campaigns/performance-pulse.tsx`

- [ ] **Step 1: Create the performance pulse component**

```tsx
// src/components/campaigns/performance-pulse.tsx
"use client";

import { StatCard } from "@/components/ui/stat-card";
import { DollarSign, TrendingUp, ShoppingCart, Target, BarChart3, Activity } from "lucide-react";
import { fmtINR, fmtNum, fmtROAS } from "@/lib/campaigns/formatters";

interface PerformancePulseProps {
  totalSpend: number;
  blendedROAS: number;
  totalConversions: number;
  avgCPA: number;
  totalRevenue: number;
  activeCampaigns: number;
  totalCampaigns: number;
}

export function PerformancePulse({
  totalSpend,
  blendedROAS,
  totalConversions,
  avgCPA,
  totalRevenue,
  activeCampaigns,
  totalCampaigns,
}: PerformancePulseProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <StatCard
        label="Total Spend"
        value={fmtINR(totalSpend)}
        color="blue"
        icon={DollarSign}
      />
      <StatCard
        label="Blended ROAS"
        value={fmtROAS(blendedROAS)}
        color="green"
        icon={TrendingUp}
      />
      <StatCard
        label="Conversions"
        value={fmtNum(totalConversions)}
        color="purple"
        icon={ShoppingCart}
      />
      <StatCard
        label="Avg CPA"
        value={avgCPA > 0 ? fmtINR(avgCPA) : "--"}
        color="orange"
        icon={Target}
      />
      <StatCard
        label="Revenue"
        value={fmtINR(totalRevenue)}
        color="navy"
        icon={BarChart3}
      />
      <StatCard
        label="Active / Total"
        value={`${activeCampaigns} / ${totalCampaigns}`}
        color="red"
        icon={Activity}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/campaigns/performance-pulse.tsx
git commit -m "feat(campaigns): add PerformancePulse stat cards component"
```

---

## Task 4: Filters Bar Component

**Files:**
- Create: `src/components/campaigns/filters-bar.tsx`

- [ ] **Step 1: Create the filters bar component**

```tsx
// src/components/campaigns/filters-bar.tsx
"use client";

import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SortKey = "spend" | "roas" | "conversions" | "cpa";
type DateRange = "today" | "last_7d" | "last_30d";

interface FiltersBarProps {
  platformFilter: string;
  onPlatformChange: (platform: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  sortBy: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}

const PLATFORM_FILTERS = [
  { key: "all", label: "All" },
  { key: "META", label: "Meta" },
  { key: "GOOGLE", label: "Google" },
];

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "last_7d", label: "7d" },
  { key: "last_30d", label: "30d" },
];

const SORT_OPTIONS: { label: string; col: SortKey }[] = [
  { label: "Spend", col: "spend" },
  { label: "ROAS", col: "roas" },
  { label: "CPA", col: "cpa" },
  { label: "Conv", col: "conversions" },
];

export function FiltersBar({
  platformFilter,
  onPlatformChange,
  dateRange,
  onDateRangeChange,
  searchInput,
  onSearchChange,
  sortBy,
  sortDir,
  onSort,
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4 pb-4 border-b border-card-border">
      {/* Platform filter */}
      <div className="flex items-center gap-1">
        {PLATFORM_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onPlatformChange(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              platformFilter === f.key
                ? "bg-navy text-white"
                : "text-muted hover:bg-surface"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
        {DATE_RANGES.map((d) => (
          <button
            key={d.key}
            onClick={() => onDateRangeChange(d.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              dateRange === d.key
                ? "bg-white text-brand-blue shadow-sm"
                : "text-muted hover:text-text"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 min-w-[200px] max-w-sm relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search campaigns..."
          className="w-full bg-white border border-card-border rounded-lg pl-9 pr-3 py-2 text-xs text-text placeholder-muted focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
      </div>

      {/* Sort buttons */}
      <div className="flex gap-1.5 ml-auto">
        {SORT_OPTIONS.map(({ label, col }) => (
          <button
            key={col}
            onClick={() => onSort(col)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border",
              sortBy === col
                ? "bg-brand-blue/10 text-brand-blue border-brand-blue/20 font-medium"
                : "text-muted hover:text-text hover:bg-surface border-card-border"
            )}
          >
            {label}
            {sortBy === col ? (
              sortDir === "desc" ? <ArrowDown size={10} /> : <ArrowUp size={10} />
            ) : (
              <ArrowUpDown size={10} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/campaigns/filters-bar.tsx
git commit -m "feat(campaigns): add FiltersBar component with platform, date range, search, sort"
```

---

## Task 5: Campaign Card Component

**Files:**
- Create: `src/components/campaigns/campaign-card.tsx`

- [ ] **Step 1: Create the campaign card component**

```tsx
// src/components/campaigns/campaign-card.tsx
"use client";

import { useState } from "react";
import { Play, Pause, Pencil, Brain, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fmtINR, fmtNum, fmtROAS, fmtPct, safe } from "@/lib/campaigns/formatters";

export interface CampaignMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionValue: number;
  roas: number;
  cpa: number;
  cpc: number;
}

export interface Campaign {
  id: string;
  dbId?: string;
  platform: string;
  name: string;
  status: string;
  campaignType: string;
  dailyBudget: number;
  metrics: CampaignMetrics;
}

interface CampaignCardProps {
  campaign: Campaign;
  healthDot: "red" | "amber" | "green" | "gray";
  currentAccountId: string;
  isEditing: boolean;
  isAnalyzing: boolean;
  onToggleEdit: (campaign: Campaign) => void;
  onToggleAnalyze: (campaign: Campaign) => void;
  editPanel?: React.ReactNode;
  analyzePanel?: React.ReactNode;
}

export function CampaignCard({
  campaign: c,
  healthDot,
  currentAccountId,
  isEditing,
  isAnalyzing,
  onToggleEdit,
  onToggleAnalyze,
  editPanel,
  analyzePanel,
}: CampaignCardProps) {
  const [expanded, setExpanded] = useState(false);

  const dotColors = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    green: "bg-green-500",
    gray: "bg-gray-400",
  };

  const roasColor =
    safe(c.metrics?.roas) >= 3
      ? "text-green-700"
      : safe(c.metrics?.roas) >= 1
      ? "text-amber-700"
      : safe(c.metrics?.roas) > 0
      ? "text-red-700"
      : "text-muted";

  const platformLink =
    c.platform === "META"
      ? `https://www.facebook.com/adsmanager/manage/campaigns?act=${currentAccountId}&campaign_ids=${c.id}`
      : `https://ads.google.com/aw/campaigns?campaignId=${c.id}`;

  return (
    <article className={cn("glass-card p-4 transition-all duration-200 card-enter hover:shadow-md")}>
      {/* Row 1: Badges + name */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Health dot */}
        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotColors[healthDot])} />

        {/* Platform badge */}
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded font-medium border",
            c.platform === "META"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200"
          )}
        >
          {c.platform}
        </span>

        {/* Campaign type */}
        {c.campaignType && (
          <span className="text-xs px-2 py-0.5 rounded bg-surface text-text-secondary font-medium border border-card-border">
            {c.campaignType.replace(/_/g, " ")}
          </span>
        )}

        {/* Status */}
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border",
            c.status === "ACTIVE"
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-amber-100 text-amber-700 border-amber-200"
          )}
        >
          {c.status === "ACTIVE" ? <Play size={8} /> : <Pause size={8} />}
          {c.status}
        </span>

        {/* Campaign name */}
        <span className="text-sm font-semibold text-text ml-1 break-all leading-snug">
          {c.name || "--"}
        </span>
      </div>

      {/* Row 2: 3 Hero Metrics */}
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <p className="text-xs text-muted">Spend</p>
          <p className="font-mono text-sm font-semibold">
            {safe(c.metrics?.spend) > 0 ? fmtINR(safe(c.metrics.spend)) : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">ROAS</p>
          <p className={cn("font-mono text-sm font-semibold", roasColor)}>
            {safe(c.metrics?.roas) > 0 ? fmtROAS(safe(c.metrics.roas)) : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">CPA</p>
          <p className="font-mono text-sm font-semibold">
            {safe(c.metrics?.cpa) > 0 ? fmtINR(safe(c.metrics.cpa)) : "--"}
          </p>
        </div>

        {/* Expandable detail metrics */}
        {expanded && (
          <>
            <div>
              <p className="text-xs text-muted">Conversions</p>
              <p className="font-mono text-sm">{safe(c.metrics?.conversions) > 0 ? fmtNum(safe(c.metrics.conversions)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">CTR</p>
              <p className="font-mono text-sm">{safe(c.metrics?.ctr) > 0 ? fmtPct(safe(c.metrics.ctr)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Impressions</p>
              <p className="font-mono text-sm">{safe(c.metrics?.impressions) > 0 ? fmtNum(safe(c.metrics.impressions)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Clicks</p>
              <p className="font-mono text-sm">{safe(c.metrics?.clicks) > 0 ? fmtNum(safe(c.metrics.clicks)) : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Daily Budget</p>
              <p className="font-mono text-sm">{c.dailyBudget > 0 ? fmtINR(c.dailyBudget) : "--"}</p>
            </div>
          </>
        )}
      </div>

      {/* Row 3: Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-card-border">
        {/* Expand metrics toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted hover:text-text transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {expanded ? "Less" : "More"}
        </button>

        <button
          onClick={() => onToggleEdit(c)}
          className={cn(
            "text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border",
            isEditing
              ? "bg-brand-blue/10 text-brand-blue border-brand-blue/20"
              : "text-muted hover:text-text hover:bg-surface border-card-border"
          )}
        >
          <Pencil size={11} />
          Edit
        </button>

        <button
          onClick={() => onToggleAnalyze(c)}
          className={cn(
            "text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border",
            isAnalyzing
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : "text-muted hover:text-text hover:bg-surface border-card-border"
          )}
        >
          <Brain size={11} />
          AI Analyze
        </button>

        <a
          href={platformLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-text hover:bg-surface flex items-center gap-1.5 ml-auto transition-colors border border-card-border"
        >
          Open in {c.platform === "META" ? "Meta" : "Google"}
          <ExternalLink size={10} />
        </a>
      </div>

      {/* Edit Panel */}
      {isEditing && editPanel && (
        <div className="panel-expand">{editPanel}</div>
      )}

      {/* Analyze Panel */}
      {isAnalyzing && analyzePanel && (
        <div className="panel-expand">{analyzePanel}</div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/campaigns/campaign-card.tsx
git commit -m "feat(campaigns): add CampaignCard component with 3 hero metrics and expandable details"
```

---

## Task 6: Health Board (Swim Lanes) Component

**Files:**
- Create: `src/components/campaigns/health-board.tsx`

- [ ] **Step 1: Create the health board component**

```tsx
// src/components/campaigns/health-board.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, TrendingUp, Eye, Pause } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fmtINR } from "@/lib/campaigns/formatters";
import type { HealthGroup } from "@/lib/campaigns/health";

interface HealthBoardProps {
  groups: HealthGroup[];
  renderCard: (campaignId: string) => React.ReactNode;
}

const LANE_CONFIG = {
  needs_attention: {
    icon: AlertTriangle,
    borderColor: "border-l-red-500",
    headerBg: "bg-red-50",
    headerText: "text-red-800",
    countBg: "bg-red-100 text-red-700",
  },
  top_performers: {
    icon: TrendingUp,
    borderColor: "border-l-green-500",
    headerBg: "bg-green-50",
    headerText: "text-green-800",
    countBg: "bg-green-100 text-green-700",
  },
  monitoring: {
    icon: Eye,
    borderColor: "border-l-amber-500",
    headerBg: "bg-amber-50",
    headerText: "text-amber-800",
    countBg: "bg-amber-100 text-amber-700",
  },
  paused: {
    icon: Pause,
    borderColor: "border-l-gray-400",
    headerBg: "bg-gray-50",
    headerText: "text-gray-700",
    countBg: "bg-gray-200 text-gray-600",
  },
};

export function HealthBoard({ groups, renderCard }: HealthBoardProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <HealthLane key={group.lane} group={group} renderCard={renderCard} />
      ))}
    </div>
  );
}

function HealthLane({
  group,
  renderCard,
}: {
  group: HealthGroup;
  renderCard: (campaignId: string) => React.ReactNode;
}) {
  // Paused lane starts collapsed, others expanded
  const [collapsed, setCollapsed] = useState(group.lane === "paused");
  const config = LANE_CONFIG[group.lane];
  const Icon = config.icon;

  if (group.campaigns.length === 0) return null;

  return (
    <div className={cn("border-l-4 rounded-lg", config.borderColor)}>
      {/* Lane header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-t-lg transition-colors",
          config.headerBg,
          "hover:opacity-90"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={config.headerText} />
          <span className={cn("text-sm font-semibold", config.headerText)}>
            {group.label}
          </span>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", config.countBg)}>
            {group.campaigns.length}
          </span>
          {group.totalSpend > 0 && (
            <span className="text-xs text-muted ml-2">
              {fmtINR(group.totalSpend)} spend
            </span>
          )}
        </div>
        {collapsed ? (
          <ChevronRight size={16} className="text-muted" />
        ) : (
          <ChevronDown size={16} className="text-muted" />
        )}
      </button>

      {/* Campaign cards */}
      {!collapsed && (
        <div className="space-y-3 p-3">
          {group.campaigns.map((c) => (
            <div key={c.id}>{renderCard(c.id)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/campaigns/health-board.tsx
git commit -m "feat(campaigns): add HealthBoard swim lane component"
```

---

## Task 7: Campaign Edit Panel Component (Light Theme)

**Files:**
- Create: `src/components/campaigns/campaign-edit-panel.tsx`

This is the biggest component — it ports the existing 3-tab edit panel from dark theme to light theme using design system tokens. The logic is preserved; only styling changes.

- [ ] **Step 1: Create the edit panel component**

This file is large. It contains the Campaign tab, Ad Sets tab, and Ads tab from the original page, restyled with design system tokens. The key changes are:

- All `bg-gray-800/*` → `bg-surface` or `bg-white`
- All `bg-gray-900/*` inputs → `bg-white border-card-border`
- All `text-gray-*` → `text-text`, `text-muted`, `text-text-secondary`
- All `text-[10px]` → `text-xs`
- All inline button styles → `btn-primary`, `btn-secondary`, `btn-approve`
- Status change buttons trigger `ConfirmDialog`
- Save results use `showToast()`
- Panels use `<fieldset>` + `<legend>` grouping

Write the full file to `src/components/campaigns/campaign-edit-panel.tsx`. The file should:

1. Accept all the same props as the current inline edit panel (editData, adSets, ads, callbacks)
2. Export a single `CampaignEditPanel` component
3. Use `cn()` for all conditional classes
4. Use `showToast()` for save feedback
5. Group Ad Set fields into fieldsets: "Budget", "Optimization", "Targeting", "Schedule"
6. Keep the same API call signatures — just restyle the UI

The implementation should extract the campaign edit tab, ad sets tab, and ads tab sections from the current `page.tsx` (lines 915-1510) and restyle them. The core logic (API calls, state management) stays in the parent page.

- [ ] **Step 2: Commit**

```bash
git add src/components/campaigns/campaign-edit-panel.tsx
git commit -m "feat(campaigns): add CampaignEditPanel component with light theme design system"
```

---

## Task 8: Campaign Analyze Panel Component (Light Theme)

**Files:**
- Create: `src/components/campaigns/campaign-analyze-panel.tsx`

- [ ] **Step 1: Create the analyze panel component**

```tsx
// src/components/campaigns/campaign-analyze-panel.tsx
"use client";

import { Brain, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AnalyzePanelProps {
  isLoading: boolean;
  results: any | null;
  onClose: () => void;
}

export function CampaignAnalyzePanel({ isLoading, results, onClose }: AnalyzePanelProps) {
  return (
    <div className="mt-3 p-4 glass-card border-l-4 border-l-purple-500">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={14} className="text-purple-600" />
        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
          Deep AI Analysis
        </span>
        <button
          onClick={onClose}
          className="ml-auto text-muted hover:text-text transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6">
          <Loader2 size={16} className="animate-spin text-purple-500" />
          <div>
            <span className="text-xs font-medium">Deep analyzing</span>
            <span className="text-xs text-purple-500 animate-pulse">...</span>
            <p className="text-xs text-muted mt-0.5">
              Fetching ad sets, ads, breakdowns, and 7-day trends from Meta API
            </p>
          </div>
        </div>
      ) : results ? (
        <div>
          <div className="space-y-2.5">
            {(results.suggestions || []).map((s: any, i: number) => (
              <div
                key={i}
                className={cn(
                  "pl-3 py-2 pr-3 rounded-r-lg text-sm",
                  s.type === "warning" && "border-l-2 border-red-500 bg-red-50",
                  s.type === "success" && "border-l-2 border-green-500 bg-green-50",
                  s.type === "opportunity" && "border-l-2 border-purple-500 bg-purple-50",
                  !["warning", "success", "opportunity"].includes(s.type) && "border-l-2 border-blue-500 bg-blue-50"
                )}
              >
                <p className="font-semibold text-text text-sm">
                  {s.icon} {s.title}
                </p>
                <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
          {results.meta && (
            <div className="mt-3 pt-3 border-t border-card-border">
              <p className="text-xs text-muted">
                Analyzed: {results.meta.adSetsCount} ad sets, {results.meta.adsCount} ads,{" "}
                {results.meta.ageSegments} age segments, {results.meta.placementsCount} placements,{" "}
                {results.meta.devicesCount} devices, {results.meta.dailyDays}-day trend
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/campaigns/campaign-analyze-panel.tsx
git commit -m "feat(campaigns): add CampaignAnalyzePanel component with light theme"
```

---

## Task 9: Rewrite Main Page as Slim Orchestrator

**Files:**
- Rewrite: `src/app/dashboard/campaigns/page.tsx`

This is the core task. The 1636-line monolith becomes a ~400-line orchestrator that:
1. Manages state (data fetching, filters, edit/analyze state)
2. Wires components together
3. Uses `ToastProvider` and `ConfirmDialog`
4. Uses `PageHeader` for the header
5. Exports the `Campaign` type for use by other components

- [ ] **Step 1: Rewrite the page**

The new page should:

1. **Imports**: Import all new components (`PerformancePulse`, `FiltersBar`, `HealthBoard`, `CampaignCard`, `CampaignEditPanel`, `CampaignAnalyzePanel`), shared UI (`PageHeader`, `ToastProvider`, `showToast`, `ConfirmDialog`), and utilities (`cn`, `classifyCampaigns`, `computeAggregateStats`, `getHealthDot`).

2. **State**: Keep the same state variables from the original page but add:
   - `dateRange` state (default: `"last_7d"`)
   - `platformFilter` state (default: `"all"`)
   - Remove `statusFilter` (replaced by health lanes)
   - `confirmDialog` state for status change confirmations

3. **Data fetching**: Same `fetchData` callback, but pass `dateRange` to the API. Remove the `statusFilter` param (fetch all, classify client-side).

4. **Health classification**: After data loads, compute `aggregateStats` and `healthGroups` using the utilities.

5. **Platform filtering**: Apply client-side platform filter before health classification.

6. **Layout**:
   ```
   <ToastProvider>
     <div className="min-h-screen bg-surface">
       <div className="max-w-7xl mx-auto px-8 py-8">
         <PageHeader ... />
         <PerformancePulse ... />
         <FiltersBar ... />
         <HealthBoard groups={healthGroups} renderCard={...} />
         <Pagination ... />
       </div>
     </div>
     <ConfirmDialog ... />
   </ToastProvider>
   ```

7. **renderCard callback**: For each campaign ID, render a `<CampaignCard>` with the appropriate props, edit panel, and analyze panel.

8. **Remove hardcoded auth**: Move the `AUTH` constant to use environment variables or the existing auth system. For now, keep Basic auth but read from a constant that's not the raw password. This is addressed as a separate security task.

9. **Export Campaign type**: Export the `Campaign` and `CampaignMetrics` interfaces from a shared location so `health.ts` can import them.

Key structural decisions:
- Move the `Campaign` and `CampaignMetrics` types to `src/components/campaigns/campaign-card.tsx` (already done in Task 5) and import from there in both the page and health utility.
- The edit panel logic (all the ad set/ads state, save handlers) stays in the page as state + callbacks, passed down to `CampaignEditPanel` as props.
- The page re-exports `Campaign` type from campaign-card for use by health.ts.

- [ ] **Step 2: Update health.ts to import Campaign from campaign-card**

In `src/lib/campaigns/health.ts`, change the import:
```typescript
import type { Campaign } from "@/components/campaigns/campaign-card";
```

- [ ] **Step 3: Verify the app compiles**

Run: `cd /Users/terrypaul/Desktop/Phase_1/luxe-ai && npx next build --no-lint 2>&1 | tail -30`

Fix any type errors or import issues.

- [ ] **Step 4: Visual verification**

Run: `cd /Users/terrypaul/Desktop/Phase_1/luxe-ai && npm run dev`

Open `http://localhost:3000/dashboard/campaigns` and verify:
- Page uses light background (`#f8fafc`)
- 6 stat cards appear at top with colored accent borders
- Filter bar shows platform pills, date range toggle, search, sort buttons
- Campaigns are grouped into swim lanes (Needs Attention / Top Performers / Monitoring / Paused)
- Campaign cards show 3 hero metrics (Spend, ROAS, CPA)
- Edit and AI Analyze panels open correctly
- Paused lane is collapsed by default

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/campaigns/page.tsx src/lib/campaigns/health.ts
git commit -m "feat(campaigns): rewrite page as slim orchestrator with health board, performance pulse, and design system alignment"
```

---

## Task 10: Pagination Component (Light Theme)

**Files:**
- Modify: `src/app/dashboard/campaigns/page.tsx` (pagination section at bottom)

- [ ] **Step 1: Restyle pagination in the page**

The pagination is part of the main page. Ensure it uses design system tokens:

```tsx
{/* Pagination */}
{stats && stats.totalPages > 1 && (
  <div className="flex items-center justify-between pt-6">
    <p className="text-xs text-muted">
      Page {page} of {stats.totalPages}
    </p>
    <div className="flex items-center gap-1">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page <= 1 || loading}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors",
          page <= 1 ? "text-muted/40 cursor-not-allowed" : "text-muted hover:bg-surface"
        )}
      >
        <ChevronLeft size={14} /> Prev
      </button>
      {/* ... page number buttons with design system classes ... */}
      <button
        onClick={() => setPage((p) => Math.min(stats.totalPages, p + 1))}
        disabled={page >= stats.totalPages || loading}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors",
          page >= stats.totalPages ? "text-muted/40 cursor-not-allowed" : "text-muted hover:bg-surface"
        )}
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  </div>
)}
```

Page number buttons use:
```tsx
className={cn(
  "w-8 h-8 rounded-lg text-xs transition-colors",
  page === pn
    ? "bg-navy text-white font-bold"
    : "text-muted hover:bg-surface"
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/campaigns/page.tsx
git commit -m "style(campaigns): restyle pagination to match design system"
```

---

## Task 11: Loading & Error States (Light Theme)

**Files:**
- Modify: `src/app/dashboard/campaigns/page.tsx`

- [ ] **Step 1: Update skeleton loading state**

Replace the dark `CardSkeleton` with a light-themed version:

```tsx
function CardSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-2.5 w-2.5 bg-gray-200 rounded-full" />
        <div className="h-5 w-14 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-64 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-14 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update error state**

```tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  <AlertTriangle size={40} className="text-brand-red mb-4" />
  <h2 className="text-lg font-semibold mb-2">Failed to load campaigns</h2>
  <p className="text-sm text-muted mb-4">{error}</p>
  <button onClick={fetchData} className="btn-primary">
    Retry
  </button>
</div>
```

- [ ] **Step 3: Update loading overlay**

```tsx
{loading && data && (
  <div className="fixed bottom-6 right-6 glass-card px-4 py-2 flex items-center gap-2 shadow-xl z-50">
    <Loader2 size={14} className="animate-spin text-brand-blue" />
    <span className="text-xs text-muted">Updating...</span>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/campaigns/page.tsx
git commit -m "style(campaigns): update loading, error, and empty states to light theme"
```

---

## Task 12: Final Integration & Polish

**Files:**
- Modify: `src/app/dashboard/campaigns/page.tsx`

- [ ] **Step 1: Verify all components integrate correctly**

Run: `cd /Users/terrypaul/Desktop/Phase_1/luxe-ai && npm run dev`

Walk through each feature:
1. Page loads with light background
2. Performance Pulse shows 6 stat cards
3. Filter bar works: platform, date range, search, sort
4. Health Board shows 4 swim lanes with correct classification
5. Campaign cards show 3 hero metrics; "More" expands to full metrics
6. Edit button opens edit panel with light-themed inputs
7. AI Analyze button opens analysis panel
8. Save operations show toast notifications
9. Pagination works with light styling
10. "Open in Meta" links work

- [ ] **Step 2: Fix any visual issues found during walkthrough**

Address any remaining dark-theme remnants, spacing issues, or broken interactions.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(campaigns): complete campaigns page redesign — CMO war room with health board"
```

---

## Summary

| Task | Component | Effort |
|------|-----------|--------|
| 1 | Formatters & Health utilities | Small |
| 2 | API date range + aggregate stats | Small |
| 3 | Performance Pulse | Small |
| 4 | Filters Bar | Small |
| 5 | Campaign Card | Medium |
| 6 | Health Board (swim lanes) | Medium |
| 7 | Edit Panel (light theme) | Large |
| 8 | Analyze Panel (light theme) | Small |
| 9 | Main Page orchestrator rewrite | Large |
| 10 | Pagination (light theme) | Small |
| 11 | Loading/error states | Small |
| 12 | Integration & polish | Medium |
