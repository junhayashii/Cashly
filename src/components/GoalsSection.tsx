import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { goals } from "@/data/goals";

export function GoalsSection() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Savings Goals</h2>
      </div>
      <div className="space-y-6">
        {goals.map((goal) => {
          const percentage = (goal.current / goal.target) * 100;
          const Icon = goal.icon;
          const remaining = goal.target - goal.current;

          return (
            <div key={goal.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-muted">
                    <Icon className={`h-5 w-5 ${goal.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {goal.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {goal.deadline}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    ${goal.current.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of ${goal.target.toLocaleString()}
                  </p>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {percentage.toFixed(0)}% Complete
                </span>
                <span className="text-muted-foreground">
                  ${remaining.toLocaleString()} to go
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
