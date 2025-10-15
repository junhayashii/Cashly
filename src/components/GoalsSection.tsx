import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, PencilLine } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import Link from "next/link";
import { useState } from "react";
import EditGoalsDialog from "@/components/EditGoalsDialog";

export function GoalsSection() {
  const { getActiveGoals, getCompletedGoals, loading, updateGoal, deleteGoal } = useGoals();
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();

  if (loading) {
    return (
      <Card className="p-4 bg-card border-border h-96 flex flex-col relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Savings Goals</h2>
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </div>
        <div className="space-y-3 flex-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-2 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const renderGoal = (goal: any) => {
    const percentage = (goal.current_amount / goal.target_amount) * 100;
    const Icon = goal.icon;
    const remaining = goal.target_amount - goal.current_amount;

    return (
      <div key={goal.id} className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className={`h-4 w-4 ${goal.color}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                {goal.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {goal.target_date
                  ? new Date(goal.target_date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "No deadline"}
              </p>
            </div>
          </div>
          <div className="text-right flex items-start gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                ${goal.current_amount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                of ${goal.target_amount.toLocaleString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setEditingGoal(goal);
                setIsEditOpen(true);
              }}
            >
              <PencilLine className="h-4 w-4" />
            </Button>
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
  };

  return (
    <Card className="p-6 bg-card border-border flex flex-col relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-foreground">Savings Goals</h2>
        <div className="text-sm text-muted-foreground">
          {activeGoals.length} active, {completedGoals.length} completed
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Active Goals
            </h3>
            {activeGoals.map(renderGoal)}
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Completed Goals
            </h3>
            {completedGoals.map(renderGoal)}
          </div>
        )}
      </div>
      <EditGoalsDialog
        goal={editingGoal}
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingGoal(null);
        }}
        updateGoalFn={updateGoal}
        deleteGoalFn={deleteGoal}
      />
    </Card>
  );
}
