"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Category, Transaction } from "@/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

type ExpenseBreakdownChartProps = {
  currencySymbol: string;
  selectedPeriod?: string;
  transactions: Transaction[];
  categories: Category[];
};

export function ExpenseBreakdownChart({
  selectedPeriod = "current-month",
  currencySymbol,
  transactions = [],
  categories = [],
}: ExpenseBreakdownChartProps) {
  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  // 期間に基づいてトランザクションをフィルタリング
  const getFilteredTransactions = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (selectedPeriod) {
      case "current-month":
        return transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date || "");
          return (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          );
        });
      case "last-month":
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear =
          currentMonth === 0 ? currentYear - 1 : currentYear;
        return transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date || "");
          return (
            transactionDate.getMonth() === lastMonth &&
            transactionDate.getFullYear() === lastMonthYear
          );
        });
      case "last-3-months":
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(currentMonth - 3);
        return transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date || "");
          return transactionDate >= threeMonthsAgo;
        });
      case "last-6-months":
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(currentMonth - 6);
        return transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date || "");
          return transactionDate >= sixMonthsAgo;
        });
      case "last-year":
        const lastYear = new Date(now);
        lastYear.setFullYear(currentYear - 1);
        return transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date || "");
          return transactionDate.getFullYear() === currentYear - 1;
        });
      default:
        return transactions;
    }
  };

  const filteredTransactions = getFilteredTransactions();

  // まず各カテゴリの支出を計算
  const categorySpending = expenseCategories
    .map((category) => {
      const spent = filteredTransactions
        .filter((t) => t.category_id === category.id && t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        name: category.name,
        value: spent,
      };
    })
    .filter((d) => d.value > 0);

  const total = categorySpending.reduce((sum, d) => sum + d.value, 0);

  // PieChart用データ（totalを使用してpercentageを計算）
  const chartData = categorySpending.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
  }));

  const COLORS = [
    "#a5d8ff",
    "#74c0fc",
    "#4dabf7",
    "#339af0",
    "#228be6",
    "#1c7ed6",
    "#1971c2",
    "#1864ab",
    "#0b5fa5",
  ];

  // Budget top3
  const budgetStats = expenseCategories
    .map((category) => {
      const spent = filteredTransactions
        .filter((t) => t.category_id === category.id && t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        ...category,
        spent,
        monthlyBudget: category.monthly_budget || 0,
      };
    })
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  return (
    <Card className="p-6 bg-card border-border h-[20rem] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Monthly Expenses
          </h2>
          <span className="text-sm text-muted-foreground">December 2025</span>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/categories">
            <span className="text-xs">See All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center py-2">
            No expenses yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-start gap-4 flex-1 min-h-0">
          {/* 左: 円グラフ */}
          <div className="w-full md:w-1/2 flex flex-col gap-3">
            <div className="relative h-56 flex items-center justify-center pb-0 -translate-y-2">
              <div className="w-56 h-56 -translate-y-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      stroke="#f0f0f0"
                      strokeWidth={2}
                      paddingAngle={2}
                      labelLine={false}
                      label={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${currencySymbol}${value.toLocaleString()} (${(
                          (value / total) *
                          100
                        ).toFixed(1)}%)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(240 10% 7%)",
                        border: "1px solid hsl(240 6% 20%)",
                        borderRadius: "0.75rem",
                      }}
                      itemStyle={{ color: "hsl(0 0% 98%)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 円グラフの真ん中に合計金額 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {currencySymbol}
                    {total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Expenses
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右: Budget top4 */}
          <div className="w-full md:w-1/2 flex flex-col justify-start gap-3 overflow-y-auto">
            {budgetStats.map((category, idx) => {
              const percentage =
                category.monthlyBudget > 0
                  ? (category.spent / category.monthlyBudget) * 100
                  : 0;
              const isOverBudget = percentage > 100;
              const color = isOverBudget
                ? "#f03e3e"
                : COLORS[idx % COLORS.length];
              const Icon = getIconComponent(category.icon || "ShoppingCart");

              return (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-muted">
                      <Icon className={`h-3 w-3 ${category.color}`} />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {category.name}
                    </p>
                    {isOverBudget && (
                      <div className="ml-auto">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          Over
                        </span>
                      </div>
                    )}
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-1.5"
                    style={{ backgroundColor: "#e9ecef", accentColor: color }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {currencySymbol}
                    {category.spent.toLocaleString()} / {currencySymbol}
                    {category.monthlyBudget.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
