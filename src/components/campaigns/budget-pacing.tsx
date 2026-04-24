"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fmtINR } from "@/lib/campaigns/formatters";

const STORAGE_KEY = "luxeai-monthly-budget";

function getStoredBudget(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : 0;
  } catch {
    return 0;
  }
}

function setStoredBudget(value: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {}
}

interface BudgetPacingProps {
  totalSpend: number;
}

export function BudgetPacing({ totalSpend }: BudgetPacingProps) {
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const stored = getStoredBudget();
    setMonthlyBudget(stored);
  }, []);

  const handleSave = () => {
    const val = parseFloat(editValue);
    if (val > 0) {
      setMonthlyBudget(val);
      setStoredBudget(val);
    }
    setEditing(false);
  };

  const handleStartEdit = () => {
    setEditValue(monthlyBudget > 0 ? String(monthlyBudget) : "");
    setEditing(true);
  };

  // Pacing calculations
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  const percentElapsed = (dayOfMonth / daysInMonth) * 100;

  const hasBudget = monthlyBudget > 0;
  const percentSpent = hasBudget ? (totalSpend / monthlyBudget) * 100 : 0;
  const dailyAvg = dayOfMonth > 0 ? totalSpend / dayOfMonth : 0;
  const projectedSpend = totalSpend + dailyAvg * daysRemaining;
  const projectedPercent = hasBudget ? (projectedSpend / monthlyBudget) * 100 : 0;

  // Pacing status
  let pacingStatus: "on_track" | "underpacing" | "overpacing" | "critical" = "on_track";
  let pacingLabel = "On Track";
  let pacingColor = "text-green-700";
  let barColor = "bg-green-500";

  if (hasBudget) {
    const deviation = percentSpent - percentElapsed;
    if (deviation > 25) {
      pacingStatus = "critical";
      pacingLabel = `Overpacing — will exhaust by ${Math.ceil(totalSpend > 0 ? (monthlyBudget / dailyAvg) : daysInMonth)}th`;
      pacingColor = "text-red-700";
      barColor = "bg-red-500";
    } else if (deviation > 10) {
      pacingStatus = "overpacing";
      pacingLabel = "Overpacing";
      pacingColor = "text-amber-700";
      barColor = "bg-amber-500";
    } else if (deviation < -25) {
      pacingStatus = "underpacing";
      pacingLabel = "Underpacing";
      pacingColor = "text-amber-700";
      barColor = "bg-amber-500";
    } else if (deviation < -10) {
      pacingStatus = "underpacing";
      pacingLabel = "Slightly Under";
      pacingColor = "text-blue-700";
      barColor = "bg-blue-500";
    }
  }

  // No budget set — prompt
  if (!hasBudget && !editing) {
    return (
      <div>
        <p className="text-xs text-muted mb-2">Set your monthly ad budget to track pacing.</p>
        <button
          onClick={handleStartEdit}
          className="btn-secondary text-xs w-full justify-center"
        >
          <Pencil size={12} /> Set Monthly Budget
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Edit mode */}
      {editing ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="e.g. 9200000"
            autoFocus
            className="flex-1 bg-white border border-card-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <button onClick={handleSave} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
            <Check size={14} />
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-gray-100 text-muted hover:bg-gray-200 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold">{fmtINR(totalSpend)}</span>
          <button onClick={handleStartEdit} className="text-muted hover:text-text transition-colors">
            <Pencil size={12} />
          </button>
        </div>
      )}

      {/* Progress bar */}
      {hasBudget && !editing && (
        <>
          <div className="relative w-full h-2.5 bg-gray-100 rounded-full mb-2">
            {/* Elapsed time marker */}
            <div
              className="absolute top-0 h-full border-r-2 border-dashed border-gray-300 z-10"
              style={{ left: `${Math.min(percentElapsed, 100)}%` }}
            />
            {/* Spend bar */}
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(percentSpent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted">of {fmtINR(monthlyBudget)}</span>
            <span className="font-medium">{percentSpent.toFixed(0)}%</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={cn("font-medium", pacingColor)}>{pacingLabel}</span>
            <span className="text-muted">{daysRemaining}d left</span>
          </div>

          {projectedPercent > 0 && (
            <p className="text-xs text-muted mt-2 pt-2 border-t border-card-border">
              Projected: {fmtINR(projectedSpend)} ({projectedPercent.toFixed(0)}% of budget)
            </p>
          )}
        </>
      )}
    </div>
  );
}
