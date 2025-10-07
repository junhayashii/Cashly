"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
    } else if (data) {
      setCategories(data);
    }

    setLoading(false);
  };

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
  }, []);

  return {
    categories,
    loading,
    refresh: fetchCategories,
    getCategoriesByType,
    getCategoryById,
    addCategory,
  };
}
