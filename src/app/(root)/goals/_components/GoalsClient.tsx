"use client";

import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { GoalsSection } from "@/components/GoalsSection";
import { MetricCard } from "@/components/MetricCard";
import { AddGoalDialog } from "@/components/AddGoalDialog";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Target, TrendingUp, DollarSign } from "lucide-react";
import { Goal } from "@/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

type GoalsClientProps = {
  initialGoals: Goal[];
  currencySymbol: string;
};

export default function GoalsClient({ initialGoals, currencySymbol }: GoalsClientProps) {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const { toast } = useToast();
  const { isMobile } = useSidebar();
  
  const {
    goals,
    loading,
    updateGoal,
    deleteGoal,
    getTotalTarget,
    getTotalCurrent,
    getTotalProgress,
    getAverageProgress,
    getActiveGoals,
    getCompletedGoals,
  } = useGoals(initialGoals);

  // Auto-save logic
  useEffect(() => {
    const runAutoSave = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log("[AutoSave] Running RPC for", user.id);
        const { error } = await supabase.rpc("run_goal_autosave", {
          p_user_id: user.id,
        });

        if (error) {
          console.error("AutoSave RPC failed:", error);
          toast({
            title: "Auto saving failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log("[AutoSave] Success!");
          // Only show success toast if something actually happened? 
          // Original code showed it every time. Keeping consistent.
          toast({
            title: "Auto saving executed",
            description: "Your goals have been automatically updated 💰",
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    runAutoSave();
  }, [toast]);

  const totalTarget = getTotalTarget();
  const totalCurrent = getTotalCurrent();
  const totalProgress = getTotalProgress();
  const averageProgress = getAverageProgress();
  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();

  const headerClass = isMobile
    ? "flex items-center justify-between pl-12"
    : "flex items-center justify-between";

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Savings & Goals
              </h2>
              <p className="text-muted-foreground">
                Loading your financial goals...
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 min-[650px]:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8 h-[95vh] max-[1030px]:h-auto max-[1030px]:overflow-y-auto flex flex-col w-full overflow-hidden">
        {/* Header Section */}
        <div className={headerClass}>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Savings & Goals
            </h2>
            <p className="text-muted-foreground">
              Track your financial goals and savings progress
            </p>
          </div>
          <div className="hidden sm:block">
            <Button onClick={() => setIsAddGoalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 min-[650px]:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Savings"
            value={`${currencySymbol}${totalCurrent.toLocaleString()}`}
            change={`${totalProgress.toFixed(1)}% of target`}
            changeType="positive"
            icon={PiggyBank}
            iconColor="bg-green-500/10 text-green-600"
          />
          <MetricCard
            title="Target Amount"
            value={`${currencySymbol}${totalTarget.toLocaleString()}`}
            change={`${activeGoals.length} active goals`}
            changeType="neutral"
            icon={Target}
            iconColor="bg-blue-500/10 text-blue-600"
          />
          <MetricCard
            title="Average Progress"
            value={`${averageProgress.toFixed(1)}%`}
            change={`${completedGoals.length} completed`}
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-purple-500/10 text-purple-600"
          />
          <MetricCard
            title="Remaining"
            value={`${currencySymbol}${(
              totalTarget - totalCurrent
            ).toLocaleString()}`}
            change="to reach all goals"
            changeType="neutral"
            icon={DollarSign}
            iconColor="bg-orange-500/10 text-orange-600"
          />
        </div>

        {/* Goals Grid */}
        <GoalsSection 
          currencySymbol={currencySymbol} 
          goals={goals}
          updateGoal={updateGoal}
          deleteGoal={deleteGoal}
        />

        {/* Add Goal Dialog */}
        <AddGoalDialog
          isOpen={isAddGoalOpen}
          onClose={() => setIsAddGoalOpen(false)}
        />

        <div className="sm:hidden fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsAddGoalOpen(true)}
            className="h-12 w-12 rounded-full shadow-lg shadow-primary/40 bg-primary text-primary-foreground"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
