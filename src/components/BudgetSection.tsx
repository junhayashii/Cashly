"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCategories } from "@/hooks/useCategories";
import { useTransaction } from "@/hooks/useTransactions";
import {
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Plane,
  Heart,
  Zap,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { type ComponentType, useMemo } from "react";
import dayjs from "dayjs";
import { ExpensePieChart } from "@/components/BudgetPieChart";

type IconComponent = ComponentType<{ className?: string }>;

const getIconComponent = (iconName: string): IconComponent => {
  const icons: Record<string, IconComponent> = {
    ShoppingCart,
    Home,
    Car,
    Coffee,
    Plane,
    Heart,
    Zap,
    DollarSign,
    TrendingUp,
    TrendingDown,
  };
  return icons[iconName] || ShoppingCart;
};

interface BudgetSectionProps {
  currencySymbol?: string;
  year?: number;
  month?: number;
  label?: string;
}

export function BudgetSection({
  currencySymbol = "$",
  year,
  month,
  label,
}: BudgetSectionProps) {
  const { categories } = useCategories();
  const { transactions } = useTransaction();

  // === 月の開始日 ===
  const periodStart = useMemo(() => {
    if (!year || !month) return null;
    return dayjs(`${year}-${String(month).padStart(2, "0")}-01`).startOf(
      "month"
    );
  }, [year, month]);

  // === トランザクションをその月に絞り込み ===
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!periodStart) return transactions;
    return transactions.filter((t) => {
      const d = dayjs(t.date);
      return d.isSame(periodStart, "month") && d.isSame(periodStart, "year");
    });
  }, [transactions, periodStart]);

  // === カテゴリ統計を生成 ===
  const getCategoryStats = () => {
    const expenseCategories = categories.filter(
      (category) => category.type === "expense"
    );

    const categoryStats = expenseCategories.map((category) => {
      const categoryTransactions = filteredTransactions.filter(
        (t) => t.category_id === category.id && t.type === "expense"
      );
      const spent = categoryTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );

      return {
        ...category,
        spent,
        monthlyBudget: category.monthly_budget || 0,
      };
    });

    // 支出額の降順に並び替え
    categoryStats.sort((a, b) => b.spent - a.spent);

    return {
      totalSpent: categoryStats.reduce((sum, c) => sum + c.spent, 0),
      categoryStats,
    };
  };

  const stats = getCategoryStats();

  // === PieChart 用のデータ ===
  const selectedMonth = useMemo(() => {
    if (!year || !month) return dayjs().format("YYYY-MM");
    return `${year}-${String(month).padStart(2, "0")}`;
  }, [year, month]);

  return (
    <Card className="p-6 bg-card border-border flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Monthly Budgets</h2>
        <span className="text-sm text-muted-foreground">
          {label || "This period"}
        </span>
      </div>

      {/* === パイチャート追加 === */}
      <div className="w-full flex justify-center">
        <ExpensePieChart
          transactions={transactions}
          categories={categories}
          currencySymbol={currencySymbol}
          selectedMonth={selectedMonth}
        />
      </div>

      {/* === カテゴリ別リスト === */}
      <div className="space-y-6">
        {stats.categoryStats.map((category) => {
          const percentage =
            category.monthlyBudget > 0
              ? (category.spent / category.monthlyBudget) * 100
              : 0;
          const isOverBudget = percentage > 100;
          const Icon = getIconComponent(category.icon || "ShoppingCart");

          return (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`h-4 w-4 ${category.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {category.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currencySymbol}
                      {category.spent.toFixed(0)} of {currencySymbol}
                      {category.monthlyBudget.toFixed(0)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    isOverBudget ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={Math.min(percentage, 100)} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
