"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Category } from "@/types";
import { createCategory as createCategoryAction, updateCategory as updateCategoryAction, deleteCategory as deleteCategoryAction } from "@/app/actions/categories";

export function useCategories(initialCategories: Category[] = []) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      setLoading(false);
    }
  }, [initialCategories]);

  // Legacy fetch for client-side only usage or revalidation
  const fetchCategories = useCallback(async () => {
    // If we have initial data, we might skip this or use it for revalidation
    // For now, keeping it but it might not be needed if we rely on server props
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;
      setCategories(data ?? []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  }, []);

  // Only fetch on mount if no initial data
  useEffect(() => {
    if (initialCategories.length === 0) {
      fetchCategories();
    }
  }, [fetchCategories, initialCategories.length]);

  const getCategoriesByType = (type: "income" | "expense") => {
    return categories.filter((category) => category.type === type);
  };

  const getCategoryById = (id: string) => {
    return categories.find((category) => category.id === id);
  };

  const addCategory = async (newCategory: Category) => {
    // Optimistic update
    setCategories((prev) => [...prev, newCategory]);
    
    // We assume the caller handles the actual server creation via Server Action or API
    // But ideally we should handle it here.
    // However, the existing addCategory just updated state.
    // The Page component called addCategory AFTER creating it?
    // Let's check how it was used.
    // In Categories page: handleAddCategory calls addCategory(newCategory)
    // AddCategoryDialog calls onAddCategory with the new category returned from API/Action.
    // So this function just updates local state.
  };

  return {
    categories,
    loading,
    refresh: fetchCategories,
    getCategoriesByType,
    getCategoryById,
    addCategory,
  };
}
