# UX Report: Campaigns Page Redesign
**Date:** 24 April 2026
**Page:** `/dashboard/campaigns`
**Live URL:** https://luxeai.staginglab.online/dashboard/campaigns
**Authored by:** Luxe AI Design System Review
**Perspective:** CMO / Marketing Leadership

---

## 1. Executive Summary

The Campaigns page is the primary interface for managing live ad campaigns across Meta and Google. In its current state, the page functions as a **developer-oriented data table** — it displays raw campaign data in a flat list with no business intelligence layer. A CMO opening this page cannot answer the three questions that matter most:

1. *"Is my ad spend working?"*
2. *"What needs my attention right now?"*
3. *"What should I scale?"*

This report identifies **14 critical UX issues** across visual design, information architecture, interaction patterns, and design system alignment — and proposes a CMO-oriented restructure that turns this page from a data browser into a **campaign war room**.

---

## 2. Current State Analysis

### 2.1 Visual Design

| Issue | Severity | Details |
|-------|----------|---------|
| **Dark theme in a light-themed app** | Critical | Page uses `bg-[#0B1120]` (dark navy) while the entire app uses `bg-surface` (`#f8fafc` light gray). Creates jarring visual break when navigating from any other page. |
| **Zero design token usage** | Critical | All colors are hardcoded Tailwind classes (`bg-gray-800/50`, `text-gray-400`). None of the established CSS custom properties (`--color-surface`, `--color-card`, `--color-muted`, etc.) are used. |
| **Illegible font sizes** | High | Extensive use of `text-[10px]` and `text-[11px]` for labels, badges, and counts. Below WCAG minimum readable size. Command Center uses `text-xs` (12px) as its smallest size. |
| **No card shadows or depth** | Medium | Campaign cards use `bg-gray-800/50` with transparent borders. No visual depth. Command Center uses `glass-card` with `box-shadow: 0 1px 3px rgba(0,0,0,0.04)` for subtle elevation. |
| **Inconsistent badge palette** | Medium | Badges use dark translucent tints (`bg-blue-500/20 text-blue-400`) while Command Center uses pastel tints (`bg-blue-100 text-blue-700`). Two completely different visual languages within the same product. |

### 2.2 Information Architecture

| Issue | Severity | Details |
|-------|----------|---------|
| **Flat list with no business logic** | Critical | All campaigns shown in a single undifferentiated list. A CMO with 67 campaigns has to manually scan each one to find problems. There is no grouping by campaign health, performance tier, or action needed. |
| **No date range context** | Critical | All metrics shown without any time period indicator. Is this spend from today? This week? Lifetime? A CMO cannot make decisions without knowing the time window. |
| **6 metrics shown per card — too many** | High | Every campaign card displays Spend, ROAS, Conversions, CPA, CTR, and Impressions simultaneously. This creates visual noise. A CMO primarily cares about 3 metrics: **Spend, ROAS, CPA**. The rest are analyst-level details. |
| **No aggregate performance view** | High | The stat bar shows Total Campaigns, Meta count, Google count, Active count, and Total Spend — but is missing the metrics that matter: **Blended ROAS, Average CPA, Total Conversions, Revenue**. It counts campaigns instead of measuring performance. |
| **Status tabs are binary** | Medium | Filter options are All / Active / Paused. This tells you nothing about campaign health. An "Active" campaign with 0.3x ROAS is a completely different situation than one with 5x ROAS — but they sit side by side. |

### 2.3 Interaction Patterns

| Issue | Severity | Details |
|-------|----------|---------|
| **No feedback system** | High | Save results appear as inline text that auto-disappears. No toast notifications, no undo capability. Command Center uses `ToastProvider` / `showToast` with undo support. |
| **No confirmation on destructive actions** | High | Changing campaign status from Active to Paused (which stops ad spend immediately) happens with a single click and no confirmation dialog. Command Center uses `ConfirmDialog` for all consequential actions. |
| **Edit panel is overwhelming** | Medium | The 3-tab edit panel (Campaign / Ad Sets / Ads) contains 20+ fields across multiple sections. Ad Set editing alone has 15 fields with targeting, placements, devices, audiences, and scheduling — all visible at once with no progressive disclosure. |

### 2.4 Component Reuse

| Shared Component | Available | Used on Campaigns Page |
|------------------|-----------|----------------------|
| `PageHeader` | Yes | No — custom inline header |
| `StatCard` | Yes — with colored top accent border, trend indicators | No — raw `div` boxes |
| `cn()` utility | Yes | No — raw string concatenation |
| `ToastProvider` / `showToast` | Yes — with undo support | No — inline text messages |
| `ConfirmDialog` | Yes | No — no confirmations at all |
| `glass-card` CSS class | Yes | No — hardcoded dark cards |
| `stat-card` CSS class | Yes — with color accent variants | No |
| `card-enter` animation | Yes | No — no entrance animations |
| `panel-expand` animation | Yes | No — panels appear instantly |
| `btn-primary` / `btn-secondary` | Yes | No — inline button styles |

**Component reuse score: 0 / 10** — The page shares nothing with the rest of the application.

### 2.5 Security

| Issue | Severity | Details |
|-------|----------|---------|
| **Hardcoded credentials in client code** | Critical | Line 146: `const AUTH = "Basic " + btoa("admin:luxeai2026")`. Authentication credentials are exposed in the browser bundle. Visible to anyone who opens DevTools. |

---

## 3. Proposed Redesign: CMO War Room

### 3.1 Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│  SECTION 1: PAGE HEADER                                       │
│  "Campaigns" + account name + refresh + account switcher      │
├──────────────────────────────────────────────────────────────┤
│  SECTION 2: PERFORMANCE PULSE                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐│
│  │ Total   │ │ Blended │ │  Total  │ │   Avg   │ │Revenue │ │Active/ ││
│  │ Spend   │ │  ROAS   │ │  Conv.  │ │   CPA   │ │        │ │ Total  ││
│  │ ₹12.4L  │ │  3.2x   │ │  1,284  │ │  ₹970   │ │₹39.8L  │ │ 42/67  ││
│  │ ↑12%    │ │ ↑0.4x   │ │  ↑8%    │ │  ↓5%    │ │ ↑15%   │ │        ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ └────────┘│
├──────────────────────────────────────────────────────────────┤
│  SECTION 3: FILTERS BAR                                       │
│  [All] [Meta] [Google]  [Today|7d|30d]  [🔍 Search]  Sort▾  │
├──────────────────────────────────────────────────────────────┤
│  SECTION 4: CAMPAIGN HEALTH BOARD                             │
│                                                               │
│  🔴 NEEDS ATTENTION (3)                                       │
│  ├─ Campaign card (ROAS 0.4x, CPA ₹4,200)                   │
│  ├─ Campaign card (ROAS 0.7x, CPA ₹3,800)                   │
│  └─ Campaign card (ROAS 0.9x, CPA ₹3,100)                   │
│                                                               │
│  🟢 TOP PERFORMERS (8)                                        │
│  ├─ Campaign card (ROAS 5.2x, CPA ₹680)                     │
│  ├─ Campaign card (ROAS 4.1x, CPA ₹890)                     │
│  └─ ...                                                       │
│                                                               │
│  🟡 MONITORING (31)                                           │
│  ├─ Campaign card (ROAS 1.8x, CPA ₹1,400)                   │
│  └─ ...                                                       │
│                                                               │
│  ⏸️  PAUSED (25) ▸ [collapsed]                                │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  SECTION 5: PAGINATION                                        │
│  Page 1 of 4    [← Prev] [1] [2] [3] [4] [Next →]           │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Section 1: Page Header

| Element | Current | Proposed |
|---------|---------|----------|
| Component | Custom inline `<div>` | `PageHeader` shared component |
| Title | "Campaigns" | "Campaigns" |
| Subtitle | "X campaigns from Meta Ads (live)" | "AJIO Luxe · 42 active campaigns · Last synced 2m ago" |
| Actions | Refresh button only | Refresh button + Date range toggle |
| Account switcher | Below header as separate row | Integrated into header actions area |

### 3.3 Section 2: Performance Pulse

Six `StatCard` components in a responsive grid. Each card uses the existing `stat-card` CSS class with colored top border accent.

| Card | Metric | Color Accent | Trend Source |
|------|--------|-------------|-------------|
| Total Spend | Sum of spend across all active campaigns | `stat-card-blue` | vs previous period |
| Blended ROAS | Total conversion value ÷ total spend | `stat-card-green` | vs previous period |
| Total Conversions | Sum of conversions | `stat-card-purple` | vs previous period |
| Average CPA | Total spend ÷ total conversions | `stat-card-orange` | vs previous period (inverted — down is good) |
| Revenue | Total conversion value | `stat-card-navy` | vs previous period |
| Active / Total | Count of active campaigns / total | `stat-card-red` | No trend |

**Key change:** Current stat bar counts campaigns by platform (Meta: X, Google: Y). This is inventory data, not performance data. The new pulse shows **financial health metrics** that a CMO actually acts on.

### 3.4 Section 3: Filters Bar

| Element | Type | Options | Position | Current State |
|---------|------|---------|----------|---------------|
| Platform | Toggle pills | All / Meta / Google | Left | Exists as status tabs — needs platform filter |
| Date Range | Toggle pills | Today / 7d / 30d | Left | **Missing entirely** — critical gap |
| Search | Text input with icon | "Search campaigns..." | Center | Exists — restyle to match design system |
| Sort | Button group | Spend / ROAS / CPA / Conversions | Right | Exists — restyle to match design system |

**Date range is the single most important missing feature.** Without it, a CMO cannot differentiate between a campaign that spent ₹5L today vs ₹5L over its lifetime.

### 3.5 Section 4: Campaign Health Board

#### 3.5.1 Swim Lane Classification Logic

| Swim Lane | Color | Rule | Default State |
|-----------|-------|------|---------------|
| **Needs Attention** | Red left border (`stat-card-red`) | Active AND (ROAS < 1.0x OR CPA > 2× average CPA across all active campaigns) | Expanded |
| **Top Performers** | Green left border (`stat-card-green`) | Active AND ROAS ≥ 3.0x AND CPA ≤ average CPA | Expanded |
| **Monitoring** | Amber left border (`stat-card-orange`) | Active AND not in above two groups | Expanded |
| **Paused** | Gray left border | Status = PAUSED | Collapsed |

Each swim lane header shows: Lane name + campaign count + aggregate spend for that group.

#### 3.5.2 Campaign Card (Simplified)

**Current card shows 6 metrics + 3 action buttons + badges = visual overload.**

Proposed card structure:

```
┌─────────────────────────────────────────────────────────┐
│ 🟢 ● [META] [SALES] Campaign Name Here                  │
│                                                          │
│  Spend          ROAS           CPA                       │
│  ₹1,24,000      3.2x           ₹970                     │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│  [Edit]  [AI Analyze]                   [Open in Meta →] │
└─────────────────────────────────────────────────────────┘
```

| Element | Visible by Default | Hidden (Expandable) |
|---------|-------------------|-------------------|
| Platform badge (META/GOOGLE) | Yes | — |
| Health dot (red/amber/green) | Yes | — |
| Campaign type (SALES/AWARENESS) | Yes | — |
| Campaign name | Yes | — |
| Spend | Yes | — |
| ROAS (color-coded) | Yes | — |
| CPA | Yes | — |
| Conversions | No | Yes — expand row |
| CTR | No | Yes — expand row |
| Impressions | No | Yes — expand row |
| Clicks | No | Yes — expand row |
| Daily Budget | No | Yes — expand row |
| Conversion Value | No | Yes — expand row |
| CPC | No | Yes — expand row |
| Edit / AI Analyze / Open in Platform | Yes | — |

**Rationale:** 3 metrics (Spend, ROAS, CPA) give a CMO everything needed to make a decision at scan speed. Detailed metrics are one click away for analysts.

### 3.6 Edit Panel

Keep existing 3-tab structure (Campaign / Ad Sets / Ads) but apply design system:

| Current | Proposed |
|---------|----------|
| `bg-gray-800/30` panel background | `bg-surface/50` with `panel-expand` animation |
| `bg-gray-900/50` inputs | White bg, `border-card-border`, focus ring `brand-blue` |
| Inline text save messages | `showToast()` with success/error states |
| No confirmation for status changes | `ConfirmDialog` when changing Active ↔ Paused |
| All fields visible at once | Group with `<fieldset>` + `<legend>` (matching Command Center edit panels) |
| `text-[10px]` labels | `text-xs` labels with `text-muted` color |

### 3.7 AI Analysis Panel

Keep existing AI analysis functionality. Restyle:

| Current | Proposed |
|---------|----------|
| Dark purple theme (`bg-gray-800/30`) | `glass-card` with purple accent border |
| Color-coded suggestion bars | Keep — but use pastel tints instead of dark translucent |
| Inline loading text | `panel-expand` animation on reveal |

---

## 4. Design System Alignment Checklist

| Token / Component | Action Required |
|-------------------|----------------|
| `bg-surface` | Replace `bg-[#0B1120]` page background |
| `glass-card` | Replace all `bg-gray-800/50 border border-gray-700/50` cards |
| `StatCard` | Replace custom stat boxes with shared component |
| `PageHeader` | Replace custom header with shared component |
| `cn()` | Replace all raw className string concatenation |
| `showToast()` | Replace inline save messages with toast notifications |
| `ConfirmDialog` | Add confirmation for status changes (Active/Paused) |
| `card-enter` | Add staggered entrance animation to campaign cards |
| `panel-expand` | Add expand animation to edit panel and AI analysis |
| `btn-primary` / `btn-secondary` | Replace all inline button styles |
| `text-xs` minimum | Replace all `text-[10px]` and `text-[11px]` with `text-xs` |
| `text-text` / `text-muted` | Replace all `text-gray-100` / `text-gray-400` hardcoded colors |
| `border-card-border` | Replace all `border-gray-700/50` |
| CSS custom properties | Replace all hardcoded color values with design tokens |

---

## 5. Priority Matrix

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| P0 | Remove hardcoded credentials from client code | Security | Low |
| P0 | Switch from dark theme to light design system | Visual consistency | Medium |
| P1 | Add Performance Pulse stat cards | CMO decision-making | Medium |
| P1 | Add Campaign Health Board swim lanes | Actionable grouping | Medium |
| P1 | Add date range filter | Data context | Medium |
| P2 | Simplify campaign card to 3 hero metrics | Scan speed | Low |
| P2 | Add toast notifications + confirmation dialogs | Interaction safety | Low |
| P2 | Use shared components (PageHeader, StatCard, cn) | Maintainability | Low |
| P3 | Add card entrance animations | Polish | Low |
| P3 | Fieldset grouping in edit panels | Edit UX | Low |

---

## 6. Success Criteria

After redesign, a CMO should be able to:

| Task | Time Target |
|------|------------|
| Know if overall ad spend is profitable | < 2 seconds (glance at Performance Pulse) |
| Identify which campaigns are losing money | < 5 seconds (scan "Needs Attention" lane) |
| Identify which campaigns to scale | < 5 seconds (scan "Top Performers" lane) |
| Find a specific campaign by name | < 3 seconds (search) |
| Change a campaign's budget | < 10 seconds (Edit → change → Save) |
| Compare Meta vs Google performance | < 5 seconds (filter toggle + pulse cards) |

---

## 7. Out of Scope

The following are explicitly excluded from this redesign:

- Campaign creation flow (new campaigns)
- Cross-campaign budget allocation / optimization
- Historical trend charts or time-series graphs
- Custom reporting or data export
- Multi-account aggregate view

---

*End of report.*
