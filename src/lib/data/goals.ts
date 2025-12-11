import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/types";

/**
 * Cached function to fetch goals for a user
 */
export const getGoalsForUser = cache(async (userId: string): Promise<Goal[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("target_date", { ascending: true });

  if (error) {
    console.error("Error fetching goals:", error);
    return [];
  }

  return data || [];
});

/**
 * Get goals by status
 */
export const getGoalsByStatus = cache(
  async (userId: string, status: "active" | "completed" | "paused"): Promise<Goal[]> => {
    const goals = await getGoalsForUser(userId);
    return goals.filter((goal) => goal.status === status);
  }
);

/**
 * Get goal progress summary
 */
export const getGoalProgressSummary = cache(async (userId: string) => {
  const goals = await getGoalsForUser(userId);
  
  const activeGoals = goals.filter((g) => g.status === "active");
  const totalTargetAmount = activeGoals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const totalCurrentAmount = activeGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  return {
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedGoals: goals.filter((g) => g.status === "completed").length,
    totalTargetAmount,
    totalCurrentAmount,
    overallProgress,
  };
});
