import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/types";

/**
 * Cached function to fetch transactions for a user
 */
export const getTransactionsForUser = cache(
  async (userId: string, limit = 50): Promise<Transaction[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }

    return data || [];
  }
);

/**
 * Get transactions within a date range
 */
export const getTransactionsByDateRange = cache(
  async (userId: string, startDate: string, endDate: string): Promise<Transaction[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions by date:", error);
      return [];
    }

    return data || [];
  }
);

/**
 * Get transaction statistics for a user
 */
export const getTransactionStats = cache(async (userId: string) => {
  const transactions = await getTransactionsForUser(userId);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    totalIncome: income,
    totalExpenses: expenses,
    netFlow: income - expenses,
    transactionCount: transactions.length,
  };
});
