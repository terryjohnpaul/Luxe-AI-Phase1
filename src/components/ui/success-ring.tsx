"use client";

import { cn } from "@/lib/utils/cn";

interface SuccessRingProps {
  value: number;
  size?: number;
  label?: string;
  className?: string;
}

function getRingColor(value: number) {
  if (value >= 80) return { stroke: "text-emerald-500", text: "text-emerald-600" };
  if (value >= 60) return { stroke: "text-blue-500", text: "text-blue-600" };
  if (value >= 40) return { stroke: "text-amber-500", text: "text-amber-600" };
  return { stroke: "text-red-400", text: "text-red-500" };
}

export function SuccessRing({ value, size = 56, label = "Confidence", className }: SuccessRingProps) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const colors = getRingColor(value);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="-rotate-90"
          viewBox="0 0 48 48"
          width={size}
          height={size}
          aria-label={`${label}: ${value}%`}
          role="img"
        >
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-100"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            strokeWidth="3"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            className={colors.stroke}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-bold",
            colors.text
          )}
        >
          {value}%
        </span>
      </div>
      <span className="text-xs text-muted font-medium">{label}</span>
    </div>
  );
}
