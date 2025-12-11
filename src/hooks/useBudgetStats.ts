"use client";

import { useMemo } from "react";
import type { Category, Transaction } from "@/types";
import dayjs from "dayjs";

interface UseBudgetStatsProps {
  transactions: Transaction[];
  categories: Category[];
  year?: number;
  month?: number;
}

export function useBudgetStats({ transactions, categories, year, month }: UseBudgetStatsProps) {
  // Month boundaries
  const periodStart = useMemo(() => {
    if (!year || !month) return null;
    return dayjs(`${year}-${String(month).padStart(2, "0")}-01`).startOf("month");
  }, [year, month]);

  // Filter transactions for the period
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!periodStart) return transactions;
    return transactions.filter((t) => {
      const d = dayjs(t.date);
      return d.isSame(periodStart, "month") && d.isSame(periodStart, "year");
    });
  }, [transactions, periodStart]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const expenseCategories = categories.filter((category) => category.type === "expense");

    const stats = expenseCategories.map((category) => {
      const categoryTransactions = filteredTransactions.filter(
        (t) => t.category_id === category.id && t.type === "expense"
      );
      const spent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        ...category,
        spent,
        monthlyBudget: category.monthly_budget || 0,
      };
    });

    // Sort by spending (descending)
    stats.sort((a, b) => b.spent - a.spent);

    const totalSpent = stats.reduce((sum, c) => sum + c.spent, 0);

    return {
      totalSpent,
      categoryStats: stats,
    };
  }, [categories, filteredTransactions]);

  return categoryStats;
}
