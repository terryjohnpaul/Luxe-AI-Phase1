"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Link,
  Key,
  Users,
  Bell,
  Check,
  X,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  ExternalLink,
  Shield,
  Mail,
  Smartphone,
  Building2,
  Store,
  Crown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ConnectedAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  currency: string;
  type: string;
  status: "connected" | "error" | "expired";
  lastSync: string;
  permissions: string[];
  connectedAt: string;
  isDefault?: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  status: "active" | "revoked";
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  lastActive: string;
  status: "active" | "invited";
}

interface NotificationPref {
  id: string;
  name: string;
  description: string;
  email: boolean;
  slack: boolean;
  push: boolean;
}

const CONNECTABLE_ACCOUNTS = [
  { id: "google-ads", platform: "Google Ads", type: "Advertising", authUrl: "/api/auth/google-ads", permissions: ["Campaign Management", "Reporting", "Budget Control"] },
  { id: "meta-ads", platform: "Meta Ads", type: "Advertising", authUrl: "/api/auth/meta-ads", permissions: ["Ads Management", "Insights", "Audiences"] },
];

const mockApiKeys: ApiKey[] = [
  { id: "k1", name: "Production API Key", key: "lx_prod_sk_a1b2c3d4e5f6g7h8i9j0", createdAt: "Jan 15, 2026", lastUsed: "Just now", status: "active" },
  { id: "k2", name: "Staging API Key", key: "lx_stag_sk_z9y8x7w6v5u4t3s2r1q0", createdAt: "Feb 1, 2026", lastUsed: "Yesterday", status: "active" },
  { id: "k3", name: "Old Integration Key", key: "lx_prod_sk_m1n2o3p4q5r6s7t8u9v0", createdAt: "Nov 10, 2025", lastUsed: "Dec 20, 2025", status: "revoked" },
];

const mockTeam: TeamMember[] = [
  { id: "m1", name: "Sharoz Dawa", email: "sharoz@luxefashion.in", role: "admin", lastActive: "Just now", status: "active" },
  { id: "m2", name: "Priya Singh", email: "priya@luxefashion.in", role: "manager", lastActive: "1 hour ago", status: "active" },
  { id: "m3", name: "Rahul Kapoor", email: "rahul@luxefashion.in", role: "manager", lastActive: "3 hours ago", status: "active" },
  { id: "m4", name: "Anita Mehta", email: "anita@luxefashion.in", role: "viewer", lastActive: "Yesterday", status: "active" },
  { id: "m5", name: "External Agency", email: "team@agency.co", role: "viewer", lastActive: "Never", status: "invited" },
];

const mockNotifications: NotificationPref[] = [
  { id: "n1", name: "Critical Signals", description: "Inventory stockouts, ROAS crashes, trend spikes", email: true, slack: true, push: true },
  { id: "n2", name: "Optimization Decisions", description: "Budget shifts, campaign pauses, creative swaps", email: true, slack: true, push: false },
  { id: "n3", name: "Campaign Performance", description: "Daily and weekly performance summaries", email: true, slack: false, push: false },
  { id: "n4", name: "New Orders (High Value)", description: "Orders over INR 50K", email: false, slack: true, push: true },
  { id: "n5", name: "Team Activity", description: "Approvals, rejections, campaign launches", email: false, slack: true, push: false },
  { id: "n6", name: "System Health", description: "API errors, sync failures, feed issues", email: true, slack: true, push: true },
];

function ToggleSwitch({ checked }: { checked: boolean }) {
  const [isChecked, setIsChecked] = useState(checked);
  return (
    <button
      onClick={() => setIsChecked(!isChecked)}
      className={cn(
        "w-10 h-5 rounded-full transition-colors relative inline-flex",
        isChecked ? "bg-brand-blue" : "bg-gray-300"
      )}
    >
      <span className={cn(
        "w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-0.5",
        isChecked ? "translate-x-5" : "translate-x-0.5"
      )} />
    </button>
  );
}

type BusinessType = "brand" | "marketplace";

interface BusinessProfile {
  type: BusinessType;
  name: string;
  brandName?: string; // Only for "brand" mode
}

function getStoredProfile(): BusinessProfile {
  if (typeof window === "undefined") return { type: "marketplace", name: "" };
  try {
    const stored = localStorage.getItem("luxeai-business-profile");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { type: "marketplace", name: "" };
}

const AUTH = "Basic " + (typeof btoa !== "undefined" ? btoa("admin:luxeai2026") : "");

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "accounts" | "api" | "team" | "notifications">("profile");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<BusinessProfile>(getStoredProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [adConnection, setAdConnection] = useState<any>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [dbAccounts, setDbAccounts] = useState<ConnectedAccount[]>([]);
  const [dbAccountsLoading, setDbAccountsLoading] = useState(true);

  const fetchAccounts = () => {
    setDbAccountsLoading(true);
    fetch("/api/settings/accounts", { headers: { Authorization: AUTH } })
      .then(r => r.json())
      .then(data => { setDbAccounts(data.accounts || []); setDbAccountsLoading(false); })
      .catch(() => setDbAccountsLoading(false));
  };

  async function setAsDefault(accountId: string) {
    await fetch("/api/settings/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: AUTH },
      body: JSON.stringify({ accountId }),
    });
    fetchAccounts();
  }

  useEffect(() => {
    fetch("/api/ads/push-draft")
      .then(r => r.json())
      .then(data => { setAdConnection(data); setConnectionLoading(false); })
      .catch(() => setConnectionLoading(false));
    fetchAccounts();
  }, []);

  const getConnectionStatus = (platformId: string): boolean => {
    if (!adConnection) return false;
    if (platformId === "google-ads") return !!adConnection.google?.connected;
    if (platformId === "meta-ads") return !!adConnection.meta?.connected;
    return false;
  };

  const getAccountName = (platformId: string): string => {
    if (!adConnection) return "Not connected";
    if (platformId === "google-ads") return adConnection.google?.connected ? "SharozDawa — " + (adConnection.google?.customerId || "864-160-4012") : "Not connected";
    if (platformId === "meta-ads") return adConnection.meta?.connected ? "Luxe AI Ads — " + (adConnection.meta?.adAccountId || "") : "Not connected";
    return "Not connected";
  };

  const saveProfile = (updated: BusinessProfile) => {
    setProfile(updated);
    localStorage.setItem("luxeai-business-profile", JSON.stringify(updated));
    // If brand mode, auto-set tier to luxury
    if (updated.type === "brand") {
      localStorage.setItem("luxeai-active-tiers", JSON.stringify(["luxury"]));
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    const next = new Set(visibleKeys);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisibleKeys(next);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Manage connected accounts, API keys, team members, and notification preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: "profile", label: "Business Profile", icon: Building2 },
          { key: "accounts", label: "Connected Accounts", icon: Link },
          { key: "api", label: "API Keys", icon: Key },
          { key: "team", label: "Team Members", icon: Users },
          { key: "notifications", label: "Notifications", icon: Bell },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-muted hover:text-text"
              )}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Business Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Business Type Selector */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-1">What type of business are you?</h3>
            <p className="text-sm text-muted mb-6">This changes how the entire platform generates intelligence and ad recommendations for you.</p>

            <div className="grid grid-cols-2 gap-4">
              {/* Brand Option */}
              <button
                onClick={() => saveProfile({ ...profile, type: "brand" })}
                className={cn(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  profile.type === "brand"
                    ? "border-purple-500 bg-purple-50/50 ring-2 ring-purple-200"
                    : "border-card-border hover:border-purple-300 hover:bg-purple-50/20"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2.5 rounded-xl", profile.type === "brand" ? "bg-purple-100" : "bg-gray-100")}>
                    <Crown size={22} className={profile.type === "brand" ? "text-purple-600" : "text-gray-400"} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Luxury Brand</h4>
                    <p className="text-xs text-muted">e.g., Burberry, Hugo Boss, Versace</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-500 mt-0.5 shrink-0" /> Intelligence focused on YOUR single brand</li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-500 mt-0.5 shrink-0" /> Competitor = other brands in your category</li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-500 mt-0.5 shrink-0" /> Celebrity tracking for YOUR brand mentions only</li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-500 mt-0.5 shrink-0" /> Signals that affect YOUR brand&apos;s sales</li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-500 mt-0.5 shrink-0" /> No brand tier system — you ARE the brand</li>
                </ul>
              </button>

              {/* Marketplace Option */}
              <button
                onClick={() => saveProfile({ ...profile, type: "marketplace" })}
                className={cn(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  profile.type === "marketplace"
                    ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-200"
                    : "border-card-border hover:border-blue-300 hover:bg-blue-50/20"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2.5 rounded-xl", profile.type === "marketplace" ? "bg-blue-100" : "bg-gray-100")}>
                    <Store size={22} className={profile.type === "marketplace" ? "text-blue-600" : "text-gray-400"} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Luxury Marketplace</h4>
                    <p className="text-xs text-muted">e.g., Ajio Luxe, Farfetch, Net-a-Porter</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2"><Check size={14} className="text-blue-500 mt-0.5 shrink-0" /> Intelligence across ALL brands you carry</li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-blue-500 mt-0.5 shrink-0" /> Competitor = other marketplaces (Tata CLiQ, Myntra)</li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-blue-500 mt-0.5 shrink-0" /> Celebrity tracking for ANY brand you carry</li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-blue-500 mt-0.5 shrink-0" /> Signals tell you WHICH brands to push when</li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-blue-500 mt-0.5 shrink-0" /> Brand tier system for 30+ brands (Luxury/Premium/Accessible)</li>
                </ul>
              </button>
            </div>
          </div>

          {/* Brand Name (Brand mode only) */}
          {profile.type === "brand" && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-1">Your Brand</h3>
              <p className="text-sm text-muted mb-4">Enter your brand name. All intelligence will be tailored to this brand.</p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted block mb-1.5">Brand Name</label>
                  <input
                    type="text"
                    value={profile.brandName || ""}
                    onChange={(e) => setProfile({ ...profile, brandName: e.target.value })}
                    placeholder="e.g., Hugo Boss, Burberry, Versace"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                  />
                </div>
                <button
                  onClick={() => saveProfile({ ...profile })}
                  className="btn-primary"
                >
                  <Sparkles size={14} /> Save & Apply
                </button>
              </div>
            </div>
          )}

          {/* How Intelligence Changes */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">How Intelligence Changes by Mode</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted">Module</th>
                    <th className="pb-3 font-medium text-purple-700">
                      <span className="flex items-center gap-1"><Crown size={12} /> Brand Mode</span>
                    </th>
                    <th className="pb-3 font-medium text-blue-700">
                      <span className="flex items-center gap-1"><Store size={12} /> Marketplace Mode</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  <tr>
                    <td className="py-3 font-medium">Command Center</td>
                    <td className="py-3 text-muted">Signals affecting YOUR brand only</td>
                    <td className="py-3 text-muted">Signals across all brands — which to push</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Celebrity Intel</td>
                    <td className="py-3 text-muted">&quot;Deepika wore YOUR blazer&quot; → run ads</td>
                    <td className="py-3 text-muted">&quot;Deepika wore Hugo Boss&quot; → push on platform</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Competitor Ads</td>
                    <td className="py-3 text-muted">Monitor rival brands (Versace vs Diesel)</td>
                    <td className="py-3 text-muted">Monitor rival marketplaces (Ajio vs Tata CLiQ)</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Wedding Campaigns</td>
                    <td className="py-3 text-muted">How YOUR brand fits each wedding phase</td>
                    <td className="py-3 text-muted">Which brands to promote for each phase</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Brand Tiers</td>
                    <td className="py-3 text-muted">Not needed — you are one brand</td>
                    <td className="py-3 text-muted">Essential — manage 30+ brands across tiers</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Ad Copy Tone</td>
                    <td className="py-3 text-muted">Always aspirational, brand-voice focused</td>
                    <td className="py-3 text-muted">Varies by tier: aspirational → value</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {profileSaved && (
            <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in">
              <Check size={16} /> Profile saved! Intelligence is now in {profile.type === "brand" ? "Brand" : "Marketplace"} mode.
            </div>
          )}
        </div>
      )}

      {/* Connected Accounts */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {connectionLoading ? "Checking connections..." :
                CONNECTABLE_ACCOUNTS.filter(a => getConnectionStatus(a.id)).length + " of " + CONNECTABLE_ACCOUNTS.length + " ad platform connections"
              }
            </p>
          </div>

          {/* OAuth Platform Cards */}
          <div className="grid grid-cols-2 gap-4">
            {CONNECTABLE_ACCOUNTS.map((account) => {
              const isConnected = getConnectionStatus(account.id);
              return (
                <div key={account.id} className={cn("glass-card p-5", isConnected && "ring-1 ring-green-200")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{account.platform}</h3>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1",
                          isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
                        )}>
                          {isConnected ? <><Check size={8} /> Connected</> : "Not connected"}
                        </span>
                      </div>
                      <p className="text-sm text-muted mt-0.5">{getAccountName(account.id)}</p>
                    </div>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{account.type}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {account.permissions.map((perm) => (
                      <span key={perm} className={cn("text-[10px] px-2 py-0.5 rounded-full", isConnected ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-400")}>{perm}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted">{isConnected ? "OAuth connected" : "Click to connect via OAuth"}</span>
                    <div className="flex gap-1">
                      {isConnected ? (
                        <button onClick={() => { window.location.href = account.authUrl; }} className="btn-secondary text-xs flex items-center gap-1">
                          <RefreshCw size={12} /> Reconnect
                        </button>
                      ) : (
                        <button onClick={() => { window.location.href = account.authUrl; }} className="btn-primary text-xs flex items-center gap-1">
                          <ExternalLink size={12} /> Connect {account.platform}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ad Accounts from Database */}
          {dbAccountsLoading ? (
            <div className="glass-card p-5 text-sm text-muted">Loading ad accounts...</div>
          ) : dbAccounts.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Ad Accounts ({dbAccounts.length})</h3>
              <div className="grid grid-cols-1 gap-3">
                {dbAccounts.map((acc) => {
                  const isMeta = acc.platform === "META";
                  const isGoogle = acc.platform === "GOOGLE";
                  return (
                    <div key={acc.id} className={cn(
                      "glass-card p-4 flex items-center justify-between",
                      isGoogle && "ring-1 ring-green-200",
                      isMeta && "ring-1 ring-blue-200",
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs",
                          isMeta ? "bg-blue-600" : "bg-green-600"
                        )}>
                          {isMeta ? "M" : "G"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {isMeta ? "Meta Ads" : "Google Ads"}
                            </span>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check size={8} /> {acc.status}
                            </span>
                            {acc.isDefault && (
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                                ⭐ Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            {acc.accountName} — {acc.accountId}
                            {acc.currency ? ` (${acc.currency})` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!acc.isDefault && (
                          <button
                            onClick={() => setAsDefault(acc.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1"
                          >
                            ⭐ Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connection help */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-sm mb-2">How it works</h3>
            <ol className="text-xs text-muted space-y-1.5 list-decimal list-inside">
              <li>Click <strong>Connect</strong> on the platform you want to link</li>
              <li>You will be redirected to Google/Meta to authorize access</li>
              <li>Grant the requested permissions</li>
              <li>You will be redirected back — the token is saved automatically</li>
              <li>Go to <strong>Command Center</strong> and click <strong>Push to Draft</strong> on any recommendation</li>
            </ol>
          </div>
        </div>
      )}

      {/* API Keys */}
      {activeTab === "api" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">API Keys</h3>
              <p className="text-sm text-muted">Manage API keys for external integrations.</p>
            </div>
            <button className="btn-primary"><Plus size={14} /> Generate Key</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Name</th>
                <th className="pb-3 font-medium text-muted">Key</th>
                <th className="pb-3 font-medium text-muted">Created</th>
                <th className="pb-3 font-medium text-muted">Last Used</th>
                <th className="pb-3 font-medium text-muted">Status</th>
                <th className="pb-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockApiKeys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{apiKey.name}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {visibleKeys.has(apiKey.id)
                          ? apiKey.key
                          : apiKey.key.substring(0, 12) + "..." + apiKey.key.substring(apiKey.key.length - 4)}
                      </code>
                      <button className="p-1 rounded hover:bg-gray-100" onClick={() => toggleKeyVisibility(apiKey.id)}>
                        {visibleKeys.has(apiKey.id) ? <EyeOff size={12} className="text-muted" /> : <Eye size={12} className="text-muted" />}
                      </button>
                      <button className="p-1 rounded hover:bg-gray-100" title="Copy">
                        <Copy size={12} className="text-muted" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 text-muted">{apiKey.createdAt}</td>
                  <td className="py-3 text-muted">{apiKey.lastUsed}</td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      apiKey.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {apiKey.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {apiKey.status === "active" && <button className="btn-reject text-xs">Revoke</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Members */}
      {activeTab === "team" && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Team Members</h3>
              <p className="text-sm text-muted">{mockTeam.filter(m => m.status === "active").length} active members</p>
            </div>
            <button className="btn-primary"><Plus size={14} /> Invite Member</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Member</th>
                <th className="pb-3 font-medium text-muted">Role</th>
                <th className="pb-3 font-medium text-muted">Last Active</th>
                <th className="pb-3 font-medium text-muted">Status</th>
                <th className="pb-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockTeam.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full capitalize",
                      member.role === "admin" && "bg-purple-100 text-purple-700",
                      member.role === "manager" && "bg-blue-100 text-blue-700",
                      member.role === "viewer" && "bg-gray-100 text-gray-700",
                    )}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 text-muted">{member.lastActive}</td>
                  <td className="py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      member.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-md hover:bg-gray-100"><Edit3 size={14} className="text-muted" /></button>
                      {member.role !== "admin" && (
                        <button className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} className="text-muted" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Role Permissions</h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-medium text-purple-700 mb-1">Admin</p>
                <p className="text-muted">Full access. Manage team, settings, billing, and all modules.</p>
              </div>
              <div>
                <p className="font-medium text-blue-700 mb-1">Manager</p>
                <p className="text-muted">Create/edit campaigns, approve decisions, manage audiences. No billing or team access.</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Viewer</p>
                <p className="text-muted">Read-only access to all dashboards and reports. Cannot create or modify.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Notification Preferences</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted">Notification</th>
                <th className="pb-3 font-medium text-muted text-center">
                  <div className="flex items-center justify-center gap-1"><Mail size={12} /> Email</div>
                </th>
                <th className="pb-3 font-medium text-muted text-center">
                  <div className="flex items-center justify-center gap-1">Slack</div>
                </th>
                <th className="pb-3 font-medium text-muted text-center">
                  <div className="flex items-center justify-center gap-1"><Smartphone size={12} /> Push</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockNotifications.map((notif) => (
                <tr key={notif.id}>
                  <td className="py-4">
                    <p className="font-medium">{notif.name}</p>
                    <p className="text-xs text-muted">{notif.description}</p>
                  </td>
                  <td className="py-4 text-center">
                    <ToggleSwitch checked={notif.email} />
                  </td>
                  <td className="py-4 text-center">
                    <ToggleSwitch checked={notif.slack} />
                  </td>
                  <td className="py-4 text-center">
                    <ToggleSwitch checked={notif.push} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button className="btn-primary">Save Preferences</button>
          </div>
        </div>
      )}
    </div>
  );
}
