"use client";

import { cn } from "@/lib/utils/cn";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

interface SignalBadgeProps {
  severity: "critical" | "high" | "medium" | "low";
  label?: string;
  className?: string;
}

const icons = {
  critical: AlertTriangle,
  high: AlertCircle,
  medium: Info,
  low: CheckCircle,
};

export function SignalBadge({ severity, label, className }: SignalBadgeProps) {
  const Icon = icons[severity];

  return (
    <span className={cn(`signal-badge signal-${severity}`, className)}>
      <Icon size={12} />
      {label || severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}
