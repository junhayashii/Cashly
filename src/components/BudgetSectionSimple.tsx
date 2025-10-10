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
  ArrowRight,
} from "lucide-react";

import { type ComponentType } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Link from "next/link";
import { Button } from "@/components/ui/button";

ChartJS.register(ArcElement, Tooltip, Legend);

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

export function BudgetSectionSimple() {
  const { categories } = useCategories();
  const { transactions } = useTransaction();

  const getCategoryStats = () => {
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

      return {
        ...category,
        spent,
        monthlyBudget: category.monthly_budget || 0,
      };
    });

    return {
      totalCategories: expenseCategories.length,
      totalSpent: categoryStats.reduce((sum, c) => sum + c.spent, 0),
      categoryStats,
    };
  };

  const stats = getCategoryStats();

  const pieData = {
    labels: stats.categoryStats.map((c) => c.name),
    datasets: [
      {
        data: stats.categoryStats.map((c) => c.spent),
        backgroundColor: stats.categoryStats.map((c) => c.color || "#888"),
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const category = stats.categoryStats[context.dataIndex];
            const percentage = (
              (category.spent / stats.totalSpent) *
              100
            ).toFixed(0);
            return `${category.name}: ${percentage}%`;
          },
        },
      },
    },
  };

  const topCategories = stats.categoryStats.slice(0, 3);

  return (
    <Card className="p-6 bg-card border-border h-80 flex flex-col">
      {/* タイトル */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Monthly Budgets</h2>
          <span className="text-sm text-muted-foreground">Top 3</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <Link href="/categories">
            <span className="text-xs">See All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {/* 円グラフ */}
      <div className="mb-4 w-full max-w-xs mx-auto">
        <Pie data={pieData} options={pieOptions} />
      </div>

      {/* カテゴリ一覧（上位3件） */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {topCategories.map((category) => {
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
      </div>
    </Card>
  );
}
