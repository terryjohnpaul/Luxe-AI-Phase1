"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function SidebarSection({ title, children, defaultOpen = true, className }: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted hover:text-text transition-colors lg:pointer-events-none"
      >
        {title}
        <span className="lg:hidden">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      <div className={cn("px-4 pb-4", !open && "hidden lg:block")}>
        {children}
      </div>
    </div>
  );
}

interface CampaignSidebarProps {
  children: React.ReactNode;
}

export function CampaignSidebar({ children }: CampaignSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:scrollbar-thin">
      {children}
    </aside>
  );
}

export { SidebarSection };
