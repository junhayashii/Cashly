"use client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, PencilLine } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import Link from "next/link";
import { useState } from "react";
import EditGoalsDialog from "@/components/EditGoalsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type GoalsSectionProps = {
  currencySymbol: string;
};

type GoalTab = "active" | "completed";

export function GoalsSection({ currencySymbol }: GoalsSectionProps) {
  const { getActiveGoals, getCompletedGoals, loading, updateGoal, deleteGoal } =
    useGoals();

  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [goalTab, setGoalTab] = useState<GoalTab>("active");

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
    const isCompleted = percentage >= 100 || goal.status === "completed";

    // 💡 次回積立日をフォーマット
    const nextDate =
      goal.next_auto_saving_date &&
      new Date(goal.next_auto_saving_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    return (
      <Card
        key={goal.id}
        className={`p-4 border-border/60 bg-background/60 backdrop-blur-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          isCompleted ? "opacity-80" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className={`h-4 w-4 ${goal.color}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{goal.name}</p>
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
          <div className="flex items-start gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {currencySymbol}
                {goal.current_amount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                of {currencySymbol}
                {goal.target_amount.toLocaleString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                setEditingGoal(goal);
                setIsEditOpen(true);
              }}
            >
              <PencilLine className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {percentage.toFixed(0)}% funded
            </span>
            <span className="text-muted-foreground">
              {currencySymbol}
              {Math.max(remaining, 0).toLocaleString()} to go
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-md border border-border/40 p-2">
            <p className="text-muted-foreground">Monthly Saving</p>
            <p className="font-semibold text-foreground">
              {currencySymbol}
              {(goal.auto_saving_amount ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-md border border-border/40 p-2 text-right">
            <p className="text-muted-foreground">Status</p>
            <p className="font-semibold text-foreground">
              {isCompleted ? "Completed" : "In progress"}
            </p>
          </div>
        </div>

        {goal.auto_saving_frequency !== "none" && nextDate && (
          <p className="mt-3 text-xs text-muted-foreground italic">
            💰 Next auto saving: {nextDate} ({goal.auto_saving_frequency})
          </p>
        )}
      </Card>
    );
  };

  return (
    <Card className="p-6 bg-card border-border flex h-full flex-col overflow-hidden">
      <Tabs
        value={goalTab}
        onValueChange={(value) => setGoalTab(value as GoalTab)}
        className="flex h-full flex-col gap-0"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Savings Goals</h2>
            <p className="text-sm text-muted-foreground">
              {activeGoals.length} active · {completedGoals.length} completed
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TabsList className="h-10 gap-1 rounded-full border-border/50 bg-muted/50">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <TabsContent value="active" className="flex flex-col gap-3">
            {activeGoals.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {activeGoals.map(renderGoal)}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Add your first goal to start tracking progress.
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="flex flex-col gap-3">
            {completedGoals.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {completedGoals.map(renderGoal)}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Completed goals will show up here once you finish them.
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

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
