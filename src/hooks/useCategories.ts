"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) {
        setCategories([]);
        return;
      }

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) {
        throw error;
      }

      setCategories(data ?? []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoriesByType = (type: "income" | "expense") => {
    return categories.filter((category) => category.type === type);
  };

  const getCategoryById = (id: string) => {
    return categories.find((category) => category.id === id);
  };

  const addCategory = (newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    refresh: fetchCategories,
    getCategoriesByType,
    getCategoryById,
    addCategory,
  };
}
