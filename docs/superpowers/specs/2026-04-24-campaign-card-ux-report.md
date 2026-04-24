# UX Report: Campaign Card Component
**Date:** 24 April 2026
**Component:** `CampaignCard` — `/src/components/campaigns/campaign-card.tsx`
**Perspective:** CMO / Marketing Leadership

---

## 1. Current State

The campaign card displays:
- Health dot (red/amber/green/gray)
- Platform badge (META/GOOGLE)
- Campaign type badge (Retargeting, Awareness, etc.)
- Status badge (ACTIVE/PAUSED)
- Campaign name (raw slug)
- 3 hero metrics: Spend, ROAS, CPA
- Action buttons: More, Edit, AI Analyze, Open in Meta

---

## 2. Issues Found

### 2.1 Campaign Name Is a Technical Slug — Severity: High

**Current:** `luxe_retarget_meta_dpa_cart_abandoners`

**Problem:** No CMO reads underscored developer slugs. This is the most prominent text on the card and it's unreadable. The eye skips over it because the brain can't parse it quickly. In a list of 17+ campaigns, scanning becomes painful.

**Proposed:** Parse and humanize the name for display while keeping the raw name available on hover/tooltip.

| Raw Name | Display Name |
|----------|-------------|
| `luxe_retarget_meta_dpa_cart_abandoners` | Cart Abandoners Retargeting |
| `luxe_bau_meta_awareness_broad_apr26` | Awareness Broad — Apr 26 |
| `luxe_bau_meta_traffic_android_interest_june25` | Traffic Android Interest — Jun 25 |
| `luxe_asc_meta_advantage_plus_shopping_apr26` | Advantage+ Shopping — Apr 26 |
| `luxe_prosp_meta_lookalike_purchasers_1pct` | Lookalike Purchasers 1% |
| `luxe_bau_meta_reels_coach_summer_collection` | Coach Summer Collection — Reels |

**Logic:**
1. Strip common prefixes: `luxe_`, `bau_`, `meta_`, `prosp_`, `retarget_`
2. Replace underscores with spaces
3. Title case each word
4. Move date suffixes (apr26, june25) to end with dash separator
5. Keep raw name as `title` attribute for hover tooltip

**Impact:** Scan speed increases 3-4x. CMO can identify campaigns at a glance.

---

### 2.2 Health Dot Has No Tooltip — Severity: Medium

**Current:** A colored circle (red/amber/green/gray) with no explanation.

**Problem:** First-time users have no idea what the dot means. Even experienced users can't tell the difference between "red because ROAS < 1x" and "red because CPA is 2x average." The dot conveys urgency but not reason.

**Proposed:** Add a `title` tooltip on hover with the classification reason.

| Dot | Tooltip Text |
|-----|-------------|
| Red | "Needs attention — ROAS 0.8x (below 1.0x threshold)" |
| Amber | "Monitoring — ROAS 2.5x (between 1.0x and 3.0x)" |
| Green | "Top performer — ROAS 6.0x (above 3.0x threshold)" |
| Gray | "Paused" |

**Impact:** Eliminates guesswork. Builds trust in the health classification system.

---

### 2.3 CPA Has No Color Coding — Severity: Medium

**Current:** CPA is displayed in plain black text regardless of value. ROAS has color coding (green ≥3x, amber 1-3x, red <1x) but CPA does not.

**Problem:** ₹5,833 CPA means nothing without context. Is that good? Bad? The CMO has to mentally calculate whether this is acceptable. Meanwhile, ROAS immediately signals red = bad because of color.

**Proposed:** Color-code CPA relative to the average CPA across all active campaigns:

| CPA vs Average | Color | Meaning |
|---------------|-------|---------|
| ≤ average | Green (`text-green-700`) | Efficient — below average cost |
| 1x–2x average | Amber (`text-amber-700`) | Acceptable — within range |
| > 2x average | Red (`text-red-700`) | Expensive — double the average |

Pass `avgCPA` from the parent (already computed in `aggregateStats`) into the card.

**Impact:** CPA becomes instantly scannable, just like ROAS.

---

### 2.4 "More" Button Is Vague — Severity: Low

**Current:** `> More` toggle that expands to show Conversions, CTR, Impressions, Clicks, Daily Budget.

**Problem:** "More" is the least descriptive label possible. More what? More options? More details? More metrics?

**Proposed:** Rename to `> All Metrics` (collapsed) and `v All Metrics` (expanded).

**Impact:** Sets correct expectation. User knows exactly what they'll see.

---

### 2.5 Action Buttons Have Awkward Spacing — Severity: Low

**Current:** `[More] [Edit] [AI Analyze]` on the left, `[Open in Meta]` far right with a huge gap.

**Problem:** The gap creates visual disconnect. The "Open in Meta" button feels orphaned. On wider screens, the gap becomes even more pronounced.

**Proposed:** Two options:

**Option A (recommended):** Add a subtle vertical divider between internal actions and external link:
```
[All Metrics] [Edit] [AI Analyze]  │  [Open in Meta →]
```

**Option B:** Group all actions left, no gap:
```
[All Metrics] [Edit] [AI Analyze] [Open in Meta →]
```

**Recommendation:** Option A — the divider signals "internal vs external" intent, which is a useful mental model.

**Impact:** Cleaner visual rhythm. Actions feel intentionally grouped.

---

### 2.6 No ROAS Target Reference — Severity: Low

**Current:** ROAS shows `0.8x` in red. The CMO knows red = bad, but doesn't know the threshold.

**Problem:** Different businesses have different breakeven ROAS. Without showing the target, the color coding feels arbitrary. "Why is 2.5x amber? My breakeven is 1.5x — that's great for me."

**Proposed:** Add a subtle target label below the ROAS value when expanded:

```
ROAS
0.8x        ← red
Target: 3.0x ← small muted text, only in expanded view
```

Or: show target inline in the lane header instead: "Needs Attention (ROAS < 1.0x)"

**Impact:** Builds trust in the classification system. CMO understands why a campaign is in a specific lane.

---

## 3. Priority Matrix

| # | Issue | Severity | Effort | Recommendation |
|---|-------|----------|--------|---------------|
| 1 | Humanize campaign names | High | Medium | Do now — biggest readability win |
| 2 | Health dot tooltip | Medium | Low | Do now — 5-minute fix |
| 3 | CPA color coding | Medium | Low | Do now — matches ROAS pattern |
| 4 | Rename "More" to "All Metrics" | Low | Trivial | Do now — one word change |
| 5 | Action button divider | Low | Low | Do now — CSS only |
| 6 | ROAS target reference | Low | Low | Do later — needs design decision on where to show |

---

## 4. Proposed Card Layout (After Fixes)

```
┌──────────────────────────────────────────────────────────────────┐
│  🔴 [META] [Retargeting] [▶ ACTIVE]                              │
│      ↑ tooltip: "Needs attention — ROAS 0.8x (below 1.0x)"      │
│                                                                   │
│  Cart Abandoners Retargeting                                      │
│  ↑ humanized name (raw slug on hover tooltip)                    │
│                                                                   │
│  Spend          ROAS           CPA                                │
│  ₹1,05,000      0.8x           ₹5,833                            │
│                  (red)          (red — 2x avg)                    │
│                                                                   │
│ ─────────────────────────────────────────────────────────────── │
│  [▸ All Metrics] [✏ Edit] [⊕ AI Analyze]  │  [Open in Meta →]   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Checklist

- [ ] Create `humanizeCampaignName()` function in `src/lib/campaigns/formatters.ts`
- [ ] Add `title` attribute to health dot `<span>` with classification reason
- [ ] Pass `avgCPA` prop to `CampaignCard` and color-code CPA value
- [ ] Rename "More"/"Less" to "All Metrics"
- [ ] Add `border-l border-card-border` divider before "Open in Meta" button
- [ ] Add `title` attribute to campaign name showing raw slug

---

*End of report.*
