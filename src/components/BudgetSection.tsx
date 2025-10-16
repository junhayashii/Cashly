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

import { type ComponentType } from "react";

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
}
export function BudgetSection({ currencySymbol }: BudgetSectionProps) {
  const { categories } = useCategories();
  const { transactions } = useTransaction();

  const getCategoryStats = () => {
    // 🔹 Expenseカテゴリのみを対象にする
    const expenseCategories = categories.filter(
      (category) => category.type === "expense"
    );

    const categoryStats = expenseCategories.map((category) => {
      const categoryTransactions = transactions.filter(
        (t) => t.category_id === category.id && t.type === "expense"
      );
      const spent = categoryTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );
      const transactionCount = categoryTransactions.length;

      return {
        ...category,
        spent,
        transactions: transactionCount,
        monthlyBudget: category.monthly_budget || 0,
      };
    });

    return {
      totalCategories: expenseCategories.length,
      totalBudget: categoryStats.reduce((sum, c) => sum + c.monthlyBudget, 0),
      totalSpent: categoryStats.reduce((sum, c) => sum + c.spent, 0),
      categoryStats,
    };
  };

  const stats = getCategoryStats();

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Monthly Budgets</h2>
        <span className="text-sm text-muted-foreground">December 2025</span>
      </div>

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
