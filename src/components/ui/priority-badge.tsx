"use client";

import { cn } from "@/lib/utils/cn";

export type Priority = "urgent" | "high" | "medium" | "opportunity";

const PRIORITY_STYLES: Record<Priority, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  opportunity: "bg-green-100 text-green-700 border-green-200",
};

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
        PRIORITY_STYLES[priority],
        className
      )}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
