"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabaseClient";
import type { Goal } from "@/types";

/**
 * Server action to get goals for a user
 */
export async function getGoals(userId: string) {
  try {
    const { data: goals, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: goals };
  } catch (error) {
    console.error("Error fetching goals:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch goals",
      data: []
    };
  }
}

/**
 * Server action to create a new goal
 */
export async function createGoal(data: Omit<Goal, "id" | "created_at" | "updated_at" | "icon" | "color">) {
  try {
    const { data: goal, error } = await supabase
      .from("goals")
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    
    return { success: true, data: goal };
  } catch (error) {
    console.error("Error creating goal:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create goal" 
    };
  }
}

/**
 * Server action to update a goal
 */
export async function updateGoal(id: string, data: Partial<Goal>) {
  try {
    const { data: goal, error } = await supabase
      .from("goals")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    
    return { success: true, data: goal };
  } catch (error) {
    console.error("Error updating goal:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update goal" 
    };
  }
}

/**
 * Server action to delete a goal
 */
export async function deleteGoal(id: string) {
  try {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting goal:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete goal" 
    };
  }
}
