"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

/**
 * Server action to get categories for a user
 */
export async function getCategories(userId: string) {
  const supabase = await createClient();
  try {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) throw error;

    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch categories",
      data: []
    };
  }
}

/**
 * Server action to create a new category
 */
export async function createCategory(data: Omit<Category, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  try {
    const { data: category, error } = await supabase
      .from("categories")
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/categories");
    revalidatePath("/dashboard");
    
    return { success: true, data: category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create category" 
    };
  }
}

/**
 * Server action to update a category
 */
export async function updateCategory(id: string, data: Partial<Category>) {
  const supabase = await createClient();
  try {
    const { data: category, error } = await supabase
      .from("categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/categories");
    revalidatePath("/dashboard");
    
    return { success: true, data: category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update category" 
    };
  }
}

/**
 * Server action to delete a category
 */
export async function deleteCategory(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/categories");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete category" 
    };
  }
}
