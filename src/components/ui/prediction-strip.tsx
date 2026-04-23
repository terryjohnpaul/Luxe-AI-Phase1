"use client";

import { cn } from "@/lib/utils/cn";
import {
  Users,
  Target,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  BarChart3,
} from "lucide-react";

export interface PredictionData {
  confidence: number;
  estimatedReach: string;
  estimatedClicks: string;
  estimatedConversions: string;
  estimatedCPA: string;
  estimatedRevenue: string;
  estimatedROAS: string;
  campaignGoal: string;
  factors: string[];
  methodology: string;
}

interface PredictionStripProps {
  prediction: PredictionData;
  className?: string;
}

export function PredictionStrip({ prediction, className }: PredictionStripProps) {
  const roasValue = parseFloat(prediction.estimatedROAS);

  return (
    <div className={cn("py-2 px-4 bg-surface/60 rounded-lg", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">
          Predicted Outcome
        </span>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            prediction.campaignGoal === "Brand Awareness"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          )}
        >
          {prediction.campaignGoal}
        </span>
      </div>

      {/* 2-row metric grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Row 1: Acquisition metrics */}
        <Metric
          icon={Users}
          iconColor="text-blue-500"
          label="Reach"
          value={prediction.estimatedReach}
        />
        <Metric
          icon={Target}
          iconColor="text-orange-500"
          label="Clicks"
          value={prediction.estimatedClicks}
        />
        <Metric
          icon={ShoppingBag}
          iconColor="text-emerald-500"
          label="Conv."
          value={prediction.estimatedConversions}
        />

        {/* Row 2: Value metrics — CPA and ROAS emphasized */}
        <MetricEmphasized
          icon={DollarSign}
          iconColor="text-amber-500"
          label="CPA"
          value={prediction.estimatedCPA}
        />
        <MetricEmphasized
          icon={TrendingUp}
          iconColor="text-green-600"
          label="Revenue"
          value={prediction.estimatedRevenue}
        />
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-green-600" aria-hidden="true" />
          <div>
            <span className="text-xs text-muted block">ROAS</span>
            <span
              className={cn(
                "text-sm font-bold",
                roasValue >= 2
                  ? "text-green-600"
                  : roasValue >= 1
                    ? "text-amber-600"
                    : "text-red-500"
              )}
            >
              {prediction.estimatedROAS}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

function Metric({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className={iconColor} aria-hidden="true" />
      <div>
        <span className="text-xs text-muted block">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}

function MetricEmphasized({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className={iconColor} aria-hidden="true" />
      <div>
        <span className="text-xs text-muted block">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  );
}
