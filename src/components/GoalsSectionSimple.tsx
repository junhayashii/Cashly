import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Goal } from "@/types";

type GoalsSectionSimpleProps = {
  goals: Goal[];
};

export function GoalsSectionSimple({ goals = [] }: GoalsSectionSimpleProps) {
  const completedGoals = goals.filter((g) => g.current_amount >= g.target_amount);
  const activeGoals = goals.filter((g) => g.current_amount < g.target_amount);

  // Show only first 2 active goals
  const displayedGoals = activeGoals.slice(0, 2);

  return (
    <Card className="p-4 bg-card border-border h-72 flex flex-col relative">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Savings Goals</h2>
          <div className="text-sm text-muted-foreground">
            {activeGoals.length} active, {completedGoals.length} completed
          </div>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/goals">
            <span className="text-xs">See All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {displayedGoals.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
             No active goals
           </div>
        ) : (
          displayedGoals.map((goal) => {
            const percentage = (goal.current_amount / goal.target_amount) * 100;
            const Icon = goal.icon;
            const remaining = goal.target_amount - goal.current_amount;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {Icon && <Icon className={`h-4 w-4 ${goal.color}`} />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {goal.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {goal.target_date
                          ? new Date(goal.target_date).toLocaleDateString(
                              "en-US",
                              { month: "short", year: "numeric" }
                            )
                          : "No deadline"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      ${goal.current_amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of ${goal.target_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Progress value={percentage} className="h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {percentage.toFixed(0)}% Complete
                  </span>
                  <span className="text-muted-foreground">
                    ${remaining.toLocaleString()} to go
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
