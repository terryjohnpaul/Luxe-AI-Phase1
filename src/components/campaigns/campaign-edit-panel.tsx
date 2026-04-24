"use client";

import { Play, Pause, Loader2, Check, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Types ────────────────────────────────────────────────────

export interface EditFields {
  name: string;
  status: string;
  dailyBudget: string;
  spendCap: string;
  bidStrategy: string;
  startTime: string;
  stopTime: string;
}

export interface AdSetData {
  id: string;
  name: string;
  status: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  optimizationGoal: string;
  billingEvent: string;
  bidStrategy: string;
  bidAmount: number | null;
  targeting: any;
  startTime: string;
  endTime: string;
  promotedObject: any;
  pacingType: string[];
}

export interface AdData {
  id: string;
  name: string;
  status: string;
  creative: {
    id: string;
    title: string;
    body: string;
    callToAction: string;
    imageUrl: string;
    thumbnailUrl: string;
  } | null;
}

export interface AdSetEditFields {
  name: string;
  status: string;
  dailyBudget: string;
  lifetimeBudget: string;
  optimizationGoal: string;
  bidStrategy: string;
  bidAmount: string;
  ageMin: string;
  ageMax: string;
  gender: string;
  geoLocations: any;
  platforms: string[];
  igPlacements: string[];
  fbPlacements: string[];
  devices: string[];
  startTime: string;
  endTime: string;
  customAudiences: any[];
  excludedCustomAudiences: any[];
}

export interface AdEditFields {
  name: string;
  status: string;
}

// ── Constants ────────────────────────────────────────────────

const BID_STRATEGIES = [
  { value: "LOWEST_COST_WITHOUT_CAP", label: "Lowest Cost" },
  { value: "LOWEST_COST_WITH_BID_CAP", label: "Bid Cap" },
  { value: "COST_CAP", label: "Cost Cap" },
];

const OPTIMIZATION_GOALS = [
  { value: "LINK_CLICKS", label: "Link Clicks" },
  { value: "LANDING_PAGE_VIEWS", label: "Landing Page Views" },
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversions" },
  { value: "REACH", label: "Reach" },
];

const IG_PLACEMENTS = [
  { value: "stream", label: "Feed" },
  { value: "story", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "explore_home", label: "Explore" },
  { value: "ig_search", label: "Search" },
  { value: "profile_feed", label: "Profile" },
];

const FB_PLACEMENTS = [
  { value: "feed", label: "Feed" },
  { value: "video_feeds", label: "Video Feeds" },
  { value: "story", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "marketplace", label: "Marketplace" },
];

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "audience_network", label: "Audience Network" },
];

const DEVICE_OPTIONS = [
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
];

// ── Props ────────────────────────────────────────────────────

interface CampaignEditPanelProps {
  campaignId: string;
  editTab: "campaign" | "adsets" | "ads";
  onTabChange: (tab: "campaign" | "adsets" | "ads") => void;
  // Campaign tab
  editFields: EditFields;
  onUpdateField: (field: keyof EditFields, value: string) => void;
  onSave: () => void;
  saving: boolean;
  saveMsg: { ok: boolean; text: string } | null;
  onCancel: () => void;
  // Ad Sets tab
  adSets: AdSetData[];
  adSetsLoading: boolean;
  adSetEdits: Record<string, AdSetEditFields>;
  onUpdateAdSetField: (adsetId: string, field: keyof AdSetEditFields, value: any) => void;
  onToggleArrayItem: (adsetId: string, field: "platforms" | "igPlacements" | "fbPlacements" | "devices", value: string) => void;
  onSaveAdSet: (adsetId: string) => void;
  adSetSaving: string | null;
  adSetSaveMsg: Record<string, { ok: boolean; text: string }>;
  // Ads tab
  ads: AdData[];
  adsLoading: boolean;
  adEdits: Record<string, AdEditFields>;
  onUpdateAdField: (adId: string, field: keyof AdEditFields, value: string) => void;
  onSaveAd: (adId: string) => void;
  adSaving: string | null;
  adSaveMsg: Record<string, { ok: boolean; text: string }>;
}

// ── Component ────────────────────────────────────────────────

export function CampaignEditPanel({
  campaignId,
  editTab,
  onTabChange,
  editFields: ed,
  onUpdateField,
  onSave,
  saving,
  saveMsg,
  onCancel,
  adSets,
  adSetsLoading,
  adSetEdits,
  onUpdateAdSetField,
  onToggleArrayItem,
  onSaveAdSet,
  adSetSaving,
  adSetSaveMsg,
  ads,
  adsLoading,
  adEdits,
  onUpdateAdField,
  onSaveAd,
  adSaving,
  adSaveMsg,
}: CampaignEditPanelProps) {
  return (
    <div className="bg-surface/50 border border-card-border rounded-lg p-4 mt-3">
      {/* Tab Bar */}
      <div className="flex gap-1 mb-4">
        {([
          { key: "campaign" as const, label: "Campaign" },
          { key: "adsets" as const, label: `Ad Sets${adSets.length > 0 ? ` (${adSets.length})` : ""}` },
          { key: "ads" as const, label: `Ads${ads.length > 0 ? ` (${ads.length})` : ""}` },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "px-4 py-2 rounded-md text-xs font-medium transition-colors",
              editTab === tab.key
                ? "bg-navy text-white"
                : "text-muted hover:text-text hover:bg-surface"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Campaign Tab ── */}
      {editTab === "campaign" && (
        <>
          <fieldset className="border border-card-border rounded-lg p-4 mb-4">
            <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Campaign Name</legend>
            <input
              type="text"
              value={ed.name}
              onChange={(e) => onUpdateField("name", e.target.value)}
              className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <fieldset className="border border-card-border rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Status</legend>
              <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
                <button
                  onClick={() => onUpdateField("status", "ACTIVE")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                    ed.status === "ACTIVE" ? "bg-green-100 text-green-700" : "text-muted hover:text-text"
                  )}
                >
                  <Play size={9} /> Active
                </button>
                <button
                  onClick={() => onUpdateField("status", "PAUSED")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                    ed.status === "PAUSED" ? "bg-amber-100 text-amber-700" : "text-muted hover:text-text"
                  )}
                >
                  <Pause size={9} /> Paused
                </button>
              </div>
            </fieldset>

            {/* Bid Strategy */}
            <fieldset className="border border-card-border rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Bid Strategy</legend>
              <select
                value={ed.bidStrategy}
                onChange={(e) => onUpdateField("bidStrategy", e.target.value)}
                className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {BID_STRATEGIES.map((bs) => (
                  <option key={bs.value} value={bs.value}>{bs.label}</option>
                ))}
              </select>
            </fieldset>

            {/* Daily Budget */}
            <fieldset className="border border-card-border rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Daily Budget (INR)</legend>
              <input
                type="number"
                value={ed.dailyBudget}
                onChange={(e) => onUpdateField("dailyBudget", e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </fieldset>

            {/* Spend Cap */}
            <fieldset className="border border-card-border rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Spend Cap (INR)</legend>
              <input
                type="number"
                value={ed.spendCap}
                onChange={(e) => onUpdateField("spendCap", e.target.value)}
                placeholder="0 = no cap"
                className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </fieldset>

            {/* Start Date */}
            <fieldset className="border border-card-border rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Start Date</legend>
              <input
                type="date"
                value={ed.startTime}
                onChange={(e) => onUpdateField("startTime", e.target.value)}
                className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </fieldset>

            {/* End Date */}
            <fieldset className="border border-card-border rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">End Date</legend>
              <input
                type="date"
                value={ed.stopTime}
                onChange={(e) => onUpdateField("stopTime", e.target.value)}
                className="w-full bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </fieldset>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-card-border">
            <button
              onClick={onSave}
              disabled={saving}
              className="btn-approve flex items-center gap-1.5 text-xs"
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Save Campaign
            </button>
            <button onClick={onCancel} className="btn-secondary text-xs flex items-center gap-1.5">
              <X size={11} /> Cancel
            </button>
            {saveMsg && (
              <span className={cn("text-xs ml-2", saveMsg.ok ? "text-green-700" : "text-red-600")}>
                {saveMsg.text}
              </span>
            )}
          </div>
        </>
      )}

      {/* ── Ad Sets Tab ── */}
      {editTab === "adsets" && (
        <div>
          {adSetsLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 size={16} className="animate-spin text-brand-blue" />
              <span className="text-xs text-muted">Loading ad sets...</span>
            </div>
          ) : adSets.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">No ad sets found for this campaign.</p>
          ) : (
            <div className="space-y-3">
              {adSets.map((as) => {
                const ase = adSetEdits[as.id];
                if (!ase) return null;
                const showBidAmount = ase.bidStrategy === "COST_CAP" || ase.bidStrategy === "LOWEST_COST_WITH_BID_CAP";
                return (
                  <div key={as.id} className="glass-card p-4">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold break-all">{as.name}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-medium border",
                        as.status === "ACTIVE" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
                      )}>
                        {as.status}
                      </span>
                    </div>

                    {/* Status */}
                    <fieldset className="border border-card-border rounded-lg p-3 mb-3">
                      <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Status</legend>
                      <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 w-fit">
                        <button
                          onClick={() => onUpdateAdSetField(as.id, "status", "ACTIVE")}
                          className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                            ase.status === "ACTIVE" ? "bg-green-100 text-green-700" : "text-muted hover:text-text"
                          )}
                        >
                          <Play size={9} /> Active
                        </button>
                        <button
                          onClick={() => onUpdateAdSetField(as.id, "status", "PAUSED")}
                          className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                            ase.status === "PAUSED" ? "bg-amber-100 text-amber-700" : "text-muted hover:text-text"
                          )}
                        >
                          <Pause size={9} /> Paused
                        </button>
                      </div>
                    </fieldset>

                    {/* Budget */}
                    <fieldset className="border border-card-border rounded-lg p-3 mb-3">
                      <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Budget</legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted mb-1 block">Daily Budget (INR)</label>
                          <input type="number" value={ase.dailyBudget} onChange={(e) => onUpdateAdSetField(as.id, "dailyBudget", e.target.value)} placeholder="--"
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                        <div>
                          <label className="text-xs text-muted mb-1 block">Lifetime Budget (INR)</label>
                          <input type="number" value={ase.lifetimeBudget} onChange={(e) => onUpdateAdSetField(as.id, "lifetimeBudget", e.target.value)} placeholder="--"
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                      </div>
                    </fieldset>

                    {/* Optimization */}
                    <fieldset className="border border-card-border rounded-lg p-3 mb-3">
                      <legend className="text-xs font-semibold text-brand-orange px-2 uppercase tracking-wide">Optimization</legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted mb-1 block">Goal</label>
                          <select value={ase.optimizationGoal} onChange={(e) => onUpdateAdSetField(as.id, "optimizationGoal", e.target.value)}
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue">
                            {OPTIMIZATION_GOALS.map((og) => (<option key={og.value} value={og.value}>{og.label}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted mb-1 block">Bid Strategy</label>
                          <select value={ase.bidStrategy} onChange={(e) => onUpdateAdSetField(as.id, "bidStrategy", e.target.value)}
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue">
                            {BID_STRATEGIES.map((bs) => (<option key={bs.value} value={bs.value}>{bs.label}</option>))}
                          </select>
                        </div>
                      </div>
                      {showBidAmount && (
                        <div className="mt-3">
                          <label className="text-xs text-muted mb-1 block">Bid Amount (INR)</label>
                          <input type="number" value={ase.bidAmount} onChange={(e) => onUpdateAdSetField(as.id, "bidAmount", e.target.value)} placeholder="e.g. 50"
                            className="w-48 bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                      )}
                    </fieldset>

                    {/* Targeting */}
                    <fieldset className="border border-card-border rounded-lg p-3 mb-3">
                      <legend className="text-xs font-semibold text-brand-purple px-2 uppercase tracking-wide">Targeting</legend>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-muted mb-1 block">Age Min</label>
                          <input type="number" value={ase.ageMin} onChange={(e) => onUpdateAdSetField(as.id, "ageMin", e.target.value)} min="13" max="65"
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                        <div>
                          <label className="text-xs text-muted mb-1 block">Age Max</label>
                          <input type="number" value={ase.ageMax} onChange={(e) => onUpdateAdSetField(as.id, "ageMax", e.target.value)} min="13" max="65"
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                        <div>
                          <label className="text-xs text-muted mb-1 block">Gender</label>
                          <select value={ase.gender} onChange={(e) => onUpdateAdSetField(as.id, "gender", e.target.value)}
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue">
                            <option value="all">All</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>

                      {/* Location (read-only) */}
                      <div className="mb-3">
                        <label className="text-xs text-muted mb-1 block">Location</label>
                        <div className="bg-surface border border-card-border rounded-lg px-3 py-1.5 text-sm text-muted">
                          {ase.geoLocations?.countries?.join(", ") || ase.geoLocations?.cities?.map((c: any) => c.name).join(", ") || "Not set"}
                          <span className="text-xs text-muted ml-2">(read-only)</span>
                        </div>
                      </div>

                      {/* Platforms */}
                      <div className="mb-3">
                        <label className="text-xs text-muted mb-1 block">Platforms</label>
                        <div className="flex flex-wrap gap-3">
                          {PLATFORM_OPTIONS.map((p) => (
                            <label key={p.value} className="flex items-center gap-1.5 text-xs text-text cursor-pointer">
                              <input type="checkbox" checked={ase.platforms.includes(p.value)} onChange={() => onToggleArrayItem(as.id, "platforms", p.value)} className="accent-brand-blue" />
                              {p.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* IG Placements */}
                      {ase.platforms.includes("instagram") && (
                        <div className="mb-3">
                          <label className="text-xs text-muted mb-1 block">Instagram Placements</label>
                          <div className="flex flex-wrap gap-3">
                            {IG_PLACEMENTS.map((p) => (
                              <label key={p.value} className="flex items-center gap-1.5 text-xs text-text cursor-pointer">
                                <input type="checkbox" checked={ase.igPlacements.includes(p.value)} onChange={() => onToggleArrayItem(as.id, "igPlacements", p.value)} className="accent-brand-blue" />
                                {p.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FB Placements */}
                      {ase.platforms.includes("facebook") && (
                        <div className="mb-3">
                          <label className="text-xs text-muted mb-1 block">Facebook Placements</label>
                          <div className="flex flex-wrap gap-3">
                            {FB_PLACEMENTS.map((p) => (
                              <label key={p.value} className="flex items-center gap-1.5 text-xs text-text cursor-pointer">
                                <input type="checkbox" checked={ase.fbPlacements.includes(p.value)} onChange={() => onToggleArrayItem(as.id, "fbPlacements", p.value)} className="accent-brand-blue" />
                                {p.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Devices */}
                      <div className="mb-3">
                        <label className="text-xs text-muted mb-1 block">Devices</label>
                        <div className="flex flex-wrap gap-3">
                          {DEVICE_OPTIONS.map((d) => (
                            <label key={d.value} className="flex items-center gap-1.5 text-xs text-text cursor-pointer">
                              <input type="checkbox" checked={ase.devices.includes(d.value)} onChange={() => onToggleArrayItem(as.id, "devices", d.value)} className="accent-brand-blue" />
                              {d.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Custom Audiences */}
                      {(ase.customAudiences.length > 0 || ase.excludedCustomAudiences.length > 0) && (
                        <div>
                          {ase.customAudiences.length > 0 && (
                            <div className="mb-1">
                              <label className="text-xs text-muted mb-1 block">Custom Audiences</label>
                              <div className="flex flex-wrap gap-1.5">
                                {ase.customAudiences.map((ca: any) => (
                                  <span key={ca.id} className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">{ca.name || ca.id}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {ase.excludedCustomAudiences.length > 0 && (
                            <div>
                              <label className="text-xs text-muted mb-1 block">Excluded Audiences</label>
                              <div className="flex flex-wrap gap-1.5">
                                {ase.excludedCustomAudiences.map((ca: any) => (
                                  <span key={ca.id} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded">{ca.name || ca.id}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </fieldset>

                    {/* Schedule */}
                    <fieldset className="border border-card-border rounded-lg p-3 mb-3">
                      <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Schedule</legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted mb-1 block">Start Date</label>
                          <input type="date" value={ase.startTime} onChange={(e) => onUpdateAdSetField(as.id, "startTime", e.target.value)}
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                        <div>
                          <label className="text-xs text-muted mb-1 block">End Date</label>
                          <input type="date" value={ase.endTime} onChange={(e) => onUpdateAdSetField(as.id, "endTime", e.target.value)}
                            className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                        </div>
                      </div>
                    </fieldset>

                    {/* Save */}
                    <div className="flex items-center gap-3 pt-3 border-t border-card-border">
                      <button onClick={() => onSaveAdSet(as.id)} disabled={adSetSaving === as.id}
                        className="btn-approve flex items-center gap-1.5 text-xs">
                        {adSetSaving === as.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                        Save Ad Set
                      </button>
                      {adSetSaveMsg[as.id] && (
                        <span className={cn("text-xs", adSetSaveMsg[as.id].ok ? "text-green-700" : "text-red-600")}>{adSetSaveMsg[as.id].text}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Ads Tab ── */}
      {editTab === "ads" && (
        <div>
          {adsLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 size={16} className="animate-spin text-brand-blue" />
              <span className="text-xs text-muted">Loading ads...</span>
            </div>
          ) : ads.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">No ads found for this campaign.</p>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => {
                const ae = adEdits[ad.id];
                if (!ae) return null;
                return (
                  <div key={ad.id} className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold break-all">{ad.name}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-medium border",
                        ad.status === "ACTIVE" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
                      )}>
                        {ad.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <fieldset className="border border-card-border rounded-lg p-3">
                        <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Status</legend>
                        <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 w-fit">
                          <button onClick={() => onUpdateAdField(ad.id, "status", "ACTIVE")}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                              ae.status === "ACTIVE" ? "bg-green-100 text-green-700" : "text-muted hover:text-text")}>
                            <Play size={9} /> Active
                          </button>
                          <button onClick={() => onUpdateAdField(ad.id, "status", "PAUSED")}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                              ae.status === "PAUSED" ? "bg-amber-100 text-amber-700" : "text-muted hover:text-text")}>
                            <Pause size={9} /> Paused
                          </button>
                        </div>
                      </fieldset>
                      <fieldset className="border border-card-border rounded-lg p-3">
                        <legend className="text-xs font-semibold text-muted px-2 uppercase tracking-wide">Ad Name</legend>
                        <input type="text" value={ae.name} onChange={(e) => onUpdateAdField(ad.id, "name", e.target.value)}
                          className="w-full bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                      </fieldset>
                    </div>

                    {/* Creative */}
                    {ad.creative && (
                      <div className="bg-surface border border-card-border rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Creative</p>
                        <div className="flex gap-3">
                          {(ad.creative.imageUrl || ad.creative.thumbnailUrl) && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-card-border">
                              <img src={ad.creative.imageUrl || ad.creative.thumbnailUrl} alt="Creative" className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                          )}
                          <div className="space-y-1 min-w-0">
                            {ad.creative.title && <p className="text-xs truncate"><span className="text-muted">Title:</span> {ad.creative.title}</p>}
                            {ad.creative.body && <p className="text-xs truncate"><span className="text-muted">Body:</span> {ad.creative.body}</p>}
                            {ad.creative.callToAction && (
                              <p className="text-xs">
                                <span className="text-muted">CTA:</span>{" "}
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">{ad.creative.callToAction.replace(/_/g, " ")}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save */}
                    <div className="flex items-center gap-3 pt-3 border-t border-card-border">
                      <button onClick={() => onSaveAd(ad.id)} disabled={adSaving === ad.id}
                        className="btn-approve flex items-center gap-1.5 text-xs">
                        {adSaving === ad.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                        Save Ad
                      </button>
                      {adSaveMsg[ad.id] && (
                        <span className={cn("text-xs", adSaveMsg[ad.id].ok ? "text-green-700" : "text-red-600")}>{adSaveMsg[ad.id].text}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
