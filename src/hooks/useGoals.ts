"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Goal } from "@/types";
import { addUIProperties } from "@/data/goals";
import { createGoal as createGoalAction, updateGoal as updateGoalAction, deleteGoal as deleteGoalAction } from "@/app/actions/goals";
import { User } from "@supabase/supabase-js";

export function useGoals(initialGoals: Goal[] = []) {
  const [goals, setGoals] = useState<Goal[]>(
    initialGoals.map((g) => addUIProperties(g))
  );
  const [loading, setLoading] = useState(initialGoals.length === 0);
  const [user, setUser] = useState<User | null>(null);

  // Sync with initialGoals when they change (e.g. after server revalidation)
  useEffect(() => {
    if (initialGoals.length > 0) {
      setGoals(initialGoals.map((g) => addUIProperties(g)));
      setLoading(false);
    }
  }, [initialGoals]);

  // Get current user (only if needed for other things, but strictly we should pass user too)
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      // If no initial goals and user exists, we might want to fetch (legacy behavior)
      // But for now we assume initialGoals are passed in Server Component usage
    };
    getUser();
  }, []);

  const createGoal = async (goalData: {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
    status?: "active" | "completed" | "paused";
    auto_saving_amount?: number;
    auto_saving_frequency?: string;
    next_auto_saving_date?: string | null;
  }) => {
    // Optimistic update could go here
    
    try {
      const result = await createGoalAction({
        ...goalData,
        user_id: user?.id || "", // Server action handles user check usually, but we need ID for type
        current_amount: goalData.current_amount || 0,
        auto_saving_amount: goalData.auto_saving_amount,
        auto_saving_frequency: goalData.auto_saving_frequency,
        next_auto_saving_date: goalData.next_auto_saving_date || undefined,
        status: goalData.status || "active",
      });

      if (!result.success || !result.data) {
        throw new Error(result.error);
      }

      // Add UI properties and add to state (if not waiting for revalidation)
      const goalWithUI = addUIProperties(result.data);
      setGoals((prev) => [goalWithUI, ...prev]);
      return goalWithUI;
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const result = await updateGoalAction(id, updates);

      if (!result.success || !result.data) {
        throw new Error(result.error);
      }

      // Add UI properties and update state
      const goalWithUI = addUIProperties(result.data);
      setGoals((prev) =>
        prev.map((goal) => (goal.id === id ? goalWithUI : goal))
      );
      return goalWithUI;
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const result = await deleteGoalAction(id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setGoals((prev) => prev.filter((goal) => goal.id !== id));
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  };

  const updateProgress = async (id: string, currentAmount: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const status = currentAmount >= goal.target_amount ? "completed" : "active";

    try {
      const result = await updateGoalAction(id, {
        current_amount: currentAmount,
        status
      });

      if (!result.success || !result.data) {
        throw new Error(result.error);
      }

      // Add UI properties and update state
      const goalWithUI = addUIProperties(result.data);
      setGoals((prev) =>
        prev.map((goal) => (goal.id === id ? goalWithUI : goal))
      );
      return goalWithUI;
    } catch (error) {
      console.error("Error updating progress:", error);
      throw error;
    }
  };

  const addSavingToGoal = async (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) {
      console.error("Goal not found for saving:", goalId);
      return;
    }

    const newAmount = goal.current_amount + amount;

    try {
      const result = await updateGoalAction(goalId, {
        current_amount: newAmount,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error);
      }

      const goalWithUI = addUIProperties(result.data);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? goalWithUI : g)));

      return goalWithUI;
    } catch (error) {
      console.error("Error adding saving to goal:", error);
    }
  };

  const getGoalById = (id: string) => {
    return goals.find((goal) => goal.id === id);
  };

  const isGoalCompleted = (goal: Goal) => {
    return goal.status === "completed" || goal.current_amount >= goal.target_amount;
  };

  const getActiveGoals = () => {
    return goals.filter((goal) => goal.status === "active" && !isGoalCompleted(goal));
  };

  const getCompletedGoals = () => {
    return goals.filter((goal) => isGoalCompleted(goal));
  };

  const getPausedGoals = () => {
    return goals.filter((goal) => goal.status === "paused");
  };

  // Calculate metrics
  const getTotalTarget = () => {
    return goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  };

  const getTotalCurrent = () => {
    return goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  };

  const getTotalProgress = () => {
    const totalTarget = getTotalTarget();
    return totalTarget > 0 ? (getTotalCurrent() / totalTarget) * 100 : 0;
  };

  const getAverageProgress = () => {
    if (goals.length === 0) return 0;
    return (
      goals.reduce((sum, goal) => {
        return sum + (goal.current_amount / goal.target_amount) * 100;
      }, 0) / goals.length
    );
  };

  return {
    goals,
    loading,
    refresh: () => {}, // No-op for now as we rely on server revalidation or local updates
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    addSavingToGoal,
    getGoalById,
    getActiveGoals,
    getCompletedGoals,
    getPausedGoals,
    getTotalTarget,
    getTotalCurrent,
    getTotalProgress,
    getAverageProgress,
  };
}
