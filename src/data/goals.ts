import { supabase } from "@/lib/supabaseClient";
import { Goal } from "@/types";
import {
  Plane,
  Home,
  GraduationCap,
  Car,
  Heart,
  Gamepad2,
  Camera,
  Laptop,
  Smartphone,
  Briefcase,
} from "lucide-react";

// Icon mapping for UI display
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  plane: Plane,
  home: Home,
  graduation: GraduationCap,
  car: Car,
  heart: Heart,
  gamepad: Gamepad2,
  camera: Camera,
  laptop: Laptop,
  smartphone: Smartphone,
  briefcase: Briefcase,
};

// Color mapping for UI display
const colorMap: Record<string, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600",
  red: "text-red-600",
  orange: "text-orange-600",
  pink: "text-pink-600",
  indigo: "text-indigo-600",
  teal: "text-teal-600",
};

// Helper function to add UI properties to database goals
export const addUIProperties = (
  goal: Goal,
  iconKey?: string,
  colorKey?: string
): Goal => {
  return {
    ...goal,
    icon: iconKey ? iconMap[iconKey] : iconMap.plane,
    color: colorKey ? colorMap[colorKey] : colorMap.blue,
  };
};

// Database operations
export const goalsApi = {
  // Fetch all goals for a user
  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error);
      throw error;
    }

    return data || [];
  },

  // Create a new goal
  async createGoal(
    goal: Omit<Goal, "id" | "created_at" | "updated_at">
  ): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .insert([goal])
      .select()
      .single();

    if (error) {
      console.error("Error creating goal:", error);
      throw error;
    }

    return data;
  },

  // Update a goal
  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating goal:", error);
      throw error;
    }

    return data;
  },

  // Delete a goal
  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from("goals").delete().eq("id", id);

    if (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  },

  // Update goal progress (current_amount)
  async updateProgress(id: string, currentAmount: number): Promise<Goal> {
    return this.updateGoal(id, {
      current_amount: currentAmount,
      status:
        currentAmount >= (await this.getGoal(id)).target_amount
          ? "completed"
          : "active",
    });
  },

  // Get a single goal
  async getGoal(id: string): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching goal:", error);
      throw error;
    }

    return data;
  },
};
