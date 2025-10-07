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

      {/* Budgets & Goals Section */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetSection />
          <GoalsSection />
        </div>
      </div>

      <SpendingChart />
    </div>
  );
};

export default BudgetsGoals;
