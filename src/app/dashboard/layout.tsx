"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Zap,
  Users,
  Palette,
  Rocket,
  GitBranch,
  ShoppingCart,
  Radio,
  BarChart3,
  MessageCircle,
  Mail,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Star,
  Heart,
  Hash,
  Brain,
  DollarSign,
  Target,
  Package,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  {
    label: "CORE",
    items: [
      { name: "Command Center", href: "/dashboard/command-center", icon: LayoutDashboard },
      { name: "Intelligence", href: "/dashboard/intelligence", icon: Radio, highlight: true },
      { name: "Flywheel", href: "/dashboard/flywheel", icon: Brain },
      { name: "Optimization Engine", href: "/dashboard/optimization", icon: Zap },
      { name: "Campaign Approval", href: "/dashboard/approval", icon: ClipboardCheck },
      { name: "Audiences", href: "/dashboard/audiences", icon: Users },
    ],
  },
  {
    label: "CREATIVE & CAMPAIGNS",
    items: [
      { name: "Creative Studio", href: "/dashboard/creative", icon: Palette },
      { name: "Campaigns", href: "/dashboard/campaigns", icon: Rocket },
      { name: "Wedding & Gifting", href: "/dashboard/wedding", icon: Heart },
      { name: "Retargeting", href: "/dashboard/retargeting", icon: GitBranch },
    ],
  },
  {
    label: "DATA",
    items: [
      { name: "Product Catalog", href: "/dashboard/catalog", icon: Package },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { name: "Celebrity Intel", href: "/dashboard/celebrity", icon: Star },
      { name: "Trend Intel", href: "/dashboard/trend-intel", icon: Hash },
      { name: "Price Intel", href: "/dashboard/price-intel", icon: DollarSign },
      { name: "Smart Intel", href: "/dashboard/smart-intel", icon: Brain },
      { name: "Competitor Ads", href: "/dashboard/competitors", icon: Eye },
      { name: "Feed Intelligence", href: "/dashboard/feed", icon: ShoppingCart },
      { name: "Signal Processing", href: "/dashboard/signals", icon: Radio },
      { name: "Prediction Accuracy", href: "/dashboard/prediction-accuracy", icon: Target },
      { name: "Performance Lab", href: "/dashboard/performance", icon: BarChart3 },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-navy text-white transition-all duration-300 ease-in-out",
          collapsed ? "w-[60px]" : "w-[260px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-sm tracking-wide">LUXE AI</div>
              <div className="text-[10px] text-white/50">Marketing Intelligence</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navigation.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                const isHighlighted = 'highlight' in item && item.highlight;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                      isActive
                        ? "bg-brand-blue/20 text-brand-blue font-medium"
                        : isHighlighted
                        ? "text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon size={18} className={cn("shrink-0", isHighlighted && !isActive && "text-blue-400")} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 border-t border-white/10 text-white/40 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-surface">
        {children}
      </main>
    </div>
  );
}
