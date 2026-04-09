"use client";

import { cn } from "@/lib/utils/cn";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "navy";
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  color = "blue",
  icon: Icon,
  className,
}: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className={cn(`stat-card stat-card-${color}`, className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-surface">
            <Icon size={18} className="text-muted" />
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {isPositive ? (
            <ArrowUpRight size={14} className="text-brand-green" />
          ) : (
            <ArrowDownRight size={14} className="text-brand-red" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              isPositive ? "text-brand-green" : "text-brand-red"
            )}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-muted ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
