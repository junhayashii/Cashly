import { Card } from "@/components/ui/card";

import { MetricCardProps } from "@/types";

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
    <Card className="p-6 bg-card border-border hover:shadow-[var(--shadow-glow)] transition-all duration-300 h-32">
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-foreground mb-2">{value}</h3>
          </div>
          <p className={`text-sm font-medium ${changeColor}`}>{change}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconColor} flex-shrink-0`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
