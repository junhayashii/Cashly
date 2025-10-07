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

export function BudgetSection() {
  const { categories } = useCategories();
  const { transactions } = useTransaction();

  const getCategoryStats = () => {
    const categoryStats = categories.map((category) => {
      const categoryTransactions = transactions.filter(
        (t) => t.category_id === category.id && t.type === category.type
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
      totalCategories: categories.length,
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
                      ${category.spent.toFixed(0)} of $
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
        {/* {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const isOverBudget = percentage > 100;
          const Icon = budget.icon;

          return (
            <div key={budget.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`h-4 w-4 ${budget.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {budget.category}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${budget.spent.toFixed(0)} of ${budget.limit.toFixed(0)}
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
        })} */}
      </div>
    </Card>
  );
}
