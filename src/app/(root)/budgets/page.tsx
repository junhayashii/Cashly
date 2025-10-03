import { BudgetSection } from "@/components/BudgetSection";
import { GoalsSection } from "@/components/GoalsSection";
import { SpendingChart } from "@/components/SpendingChart";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const BudgetsGoals = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Budgets & Goals
          </h2>
          <p className="text-muted-foreground">
            Track your spending limits and savings goals
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Budget
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Budgets Section */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">
          Monthly Budgets
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetSection />
          <SpendingChart />
        </div>
      </div>

      {/* Goals Section */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">
          Savings Goals
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoalsSection />
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Tips for Success
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">
                  Automate Your Savings
                </h4>
                <p className="text-sm text-muted-foreground">
                  Set up automatic transfers to your savings goals each month
                </p>
              </div>
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <h4 className="font-semibold text-foreground mb-2">
                  Track Your Progress
                </h4>
                <p className="text-sm text-muted-foreground">
                  Review your goals weekly to stay motivated and on track
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <h4 className="font-semibold text-foreground mb-2">
                  Celebrate Milestones
                </h4>
                <p className="text-sm text-muted-foreground">
                  Reward yourself when you reach 25%, 50%, and 75% of your goal
                </p>
              </div>
              <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
                <h4 className="font-semibold text-foreground mb-2">
                  Adjust as Needed
                </h4>
                <p className="text-sm text-muted-foreground">
                  Life changes - don't be afraid to modify your budgets and
                  goals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetsGoals;
