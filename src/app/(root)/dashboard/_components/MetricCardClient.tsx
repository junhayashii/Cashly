"use client";

import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface MetricCardClientProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconColor,
  className,
}: MetricCardClientProps) {
  const changeColor =
    changeType === "positive"
      ? "text-green-600"
      : changeType === "negative"
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <Card className={`p-6 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && <p className={`text-xs ${changeColor}`}>{change}</p>}
        </div>
        <div className={`rounded-full p-3 ${iconColor || "bg-muted"}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
