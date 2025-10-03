import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconColor,
}: MetricCardProps) {
  const changeColor =
    changeType === "positive"
      ? "text-green-600"
      : changeType === "negative"
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <Card className="p-6 bg-card border-border hover:shadow-[var(--shadow-glow)] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-foreground mb-2">{value}</h3>
          <p className={`text-sm font-medium ${changeColor}`}>{change}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
