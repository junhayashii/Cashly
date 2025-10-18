"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { Category, Transaction } from "@/types";

type ExpensePieChartProps = {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  selectedMonth: string;
};

export function ExpensePieChart({
  transactions,
  categories,
  currencySymbol,
  selectedMonth,
}: ExpensePieChartProps) {
  const periodStart = useMemo(
    () => dayjs(selectedMonth + "-01").startOf("month"),
    [selectedMonth]
  );
  const periodEnd = useMemo(
    () => dayjs(selectedMonth + "-01").endOf("month"),
    [selectedMonth]
  );

  // カテゴリ一覧（支出のみ）
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories]
  );

  // 月内の支出だけに絞り、カテゴリ別に集計
  const categorySpending = useMemo(() => {
    if (!transactions || !categories) return [];

    const result: { name: string; value: number }[] = [];

    expenseCategories.forEach((category) => {
      const spent = transactions
        .filter((t) => {
          const d = dayjs(t.date);
          return (
            t.type === "expense" &&
            t.category_id === category.id &&
            d.isSame(periodStart, "month") &&
            d.isSame(periodStart, "year")
          );
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      if (spent > 0) {
        result.push({ name: category.name, value: spent });
      }
    });

    return result;
  }, [transactions, categories, expenseCategories, periodStart]);

  const total = useMemo(
    () => categorySpending.reduce((sum, d) => sum + d.value, 0),
    [categorySpending]
  );

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

  if (!categorySpending.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center py-2">
          No expenses yet
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border-border rounded-xl h-[24rem] flex flex-col">
      {/* <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Monthly Expenses
          </h2>
          <span className="text-sm text-muted-foreground">
            {dayjs(selectedMonth + "-01").format("MMMM YYYY")}
          </span>
        </div>
      </div> */}

      {/* 円グラフ */}
      <div className="relative flex-1 flex items-center justify-center pb-10">
        <div className="w-80 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categorySpending}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                stroke="#f0f0f0"
                strokeWidth={2}
                paddingAngle={2}
                labelLine={false}
                label={false}
              >
                {categorySpending.map((entry, index) => (
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

        {/* 中央の合計 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-10">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {currencySymbol}
              {total.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Expenses</div>
          </div>
        </div>
      </div>
    </div>
  );
}
