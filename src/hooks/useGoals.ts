"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Goal } from "@/types";
import { goalsApi, addUIProperties } from "@/data/goals";

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchGoals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await goalsApi.getGoals(user.id);
      // Add UI properties to each goal
      const goalsWithUI = data.map((goal) => addUIProperties(goal));
      setGoals(goalsWithUI);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
    status?: "active" | "completed" | "paused";
  }) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const newGoal = await goalsApi.createGoal({
        ...goalData,
        user_id: user.id,
        current_amount: goalData.current_amount || 0,
        status: goalData.status || "active",
      });

      // Add UI properties and add to state
      const goalWithUI = addUIProperties(newGoal);
      setGoals((prev) => [goalWithUI, ...prev]);
      return goalWithUI;
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const updatedGoal = await goalsApi.updateGoal(id, updates);

      // Add UI properties and update state
      const goalWithUI = addUIProperties(updatedGoal);
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
      await goalsApi.deleteGoal(id);
      setGoals((prev) => prev.filter((goal) => goal.id !== id));
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  };

  const updateProgress = async (id: string, currentAmount: number) => {
    try {
      const updatedGoal = await goalsApi.updateProgress(id, currentAmount);

      // Add UI properties and update state
      const goalWithUI = addUIProperties(updatedGoal);
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
      // Supabaseにも反映
      const updatedGoal = await goalsApi.updateGoal(goalId, {
        current_amount: newAmount,
      });

      const goalWithUI = addUIProperties(updatedGoal);
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

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  return {
    goals,
    loading,
    refresh: fetchGoals,
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
