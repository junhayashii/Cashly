"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCategories } from "@/hooks/useCategories";
import { useTransaction } from "@/hooks/useTransactions";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

export function ExpenseBreakdownChart() {
  const { categories } = useCategories();
  const { transactions } = useTransaction();

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  // PieChart用データ
  const chartData = expenseCategories
    .map((category) => {
      const spent = transactions
        .filter((t) => t.category_id === category.id && t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { name: category.name, value: spent };
    })
    .filter((d) => d.value > 0);

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

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  // Budget top3
  const budgetStats = expenseCategories
    .map((category) => {
      const spent = transactions
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
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Monthly Expenses</h2>
        <span className="text-sm text-muted-foreground">December 2025</span>
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          No expenses yet
        </p>
      ) : (
        <div className="flex flex-col md:flex-row items-start gap-2">
          {/* 左: 円グラフ */}
          <div className="w-full md:w-2/3 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={130} // 大きく表示
                  stroke="#f0f0f0"
                  strokeWidth={2}
                  paddingAngle={2}
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
                    `$${value.toLocaleString()} (${(
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

          {/* 右: Budget top3 */}
          <div className="w-full md:w-1/3 flex flex-col justify-start gap-4 max-h-[280px]">
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
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <Icon className={`h-4 w-4 ${category.color}`} />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {category.name}
                    </p>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-4"
                    style={{ backgroundColor: "#e9ecef", accentColor: color }}
                  />
                  <p className="text-xs text-muted-foreground">
                    ${category.spent.toLocaleString()} / $
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
