import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { budgets } from "@/data/budget";

export function BudgetSection() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Monthly Budgets</h2>
        <span className="text-sm text-muted-foreground">December 2025</span>
      </div>
      <div className="space-y-6">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const isOverBudget = percentage > 100;
          const Icon = budget.icon;

          return (
            <div key={budget.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`h-4 w-4 ${budget.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {budget.category}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${budget.spent.toFixed(0)} of ${budget.limit.toFixed(0)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    isOverBudget ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={Math.min(percentage, 100)} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
