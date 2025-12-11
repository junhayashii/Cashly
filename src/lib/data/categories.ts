import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

/**
 * Cached function to fetch categories for a user
 */
export const getCategoriesForUser = cache(async (userId: string): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data || [];
});

/**
 * Get categories by type
 */
export const getCategoriesByType = cache(
  async (userId: string, type: "income" | "expense"): Promise<Category[]> => {
    const categories = await getCategoriesForUser(userId);
    return categories.filter((cat) => cat.type === type);
  }
);
