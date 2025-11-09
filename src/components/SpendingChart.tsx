"use client";

import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTransaction } from "@/hooks/useTransactions";
import { useMemo } from "react";
import dayjs from "dayjs";

type SpendingChartProps = {
  currencySymbol: string;
};

export const SpendingChart = ({ currencySymbol }: SpendingChartProps) => {
  const { transactions } = useTransaction();

  // 過去12ヶ月の集計データを生成
  const data = useMemo(() => {
    if (!transactions) return [];

    // 過去12ヶ月の初期データを作成
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = dayjs().subtract(11 - i, "month");
      return {
        name: date.format("MMM"), // Jan, Feb, Mar...
        year: date.year(),
        month: date.month(),
        fullDate: date.format("YYYY-MM"),
        income: 0,
        spending: 0,
      };
    });

    // トランザクションを月単位で集計（年も考慮）
    transactions.forEach((t) => {
      const transactionDate = dayjs(t.date);
      const transactionYear = transactionDate.year();
      const transactionMonth = transactionDate.month();

      // 該当する月のデータを見つける
      const monthData = monthlyData.find(
        (m) => m.year === transactionYear && m.month === transactionMonth
      );

      if (!monthData) return;

      if (t.type === "income") {
        monthData.income += Math.abs(t.amount);
      } else if (t.type === "expense") {
        monthData.spending += Math.abs(t.amount);
      }
    });

    return monthlyData;
  }, [transactions]);

  return (
    <Card className="flex h-full min-h-[24rem] flex-col border border-border/40 bg-background/60 p-6 shadow-sm backdrop-blur-sm animate-fade-in">
      {/* Header + Legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Spending Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly income vs expenses
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#4dabf7" }}
            />
            <span className="text-sm text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "#fa5252" }}
            />
            <span className="text-sm text-muted-foreground">Spending</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4dabf7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4dabf7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fa5252" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#fa5252" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value, index) => {
                const dataPoint = data[index];
                if (dataPoint && dataPoint.year !== dayjs().year()) {
                  return `${value} '${dataPoint.year.toString().slice(-2)}`;
                }
                return value;
              }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${currencySymbol}${value}`}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f1f1f",
                border: "1px solid #333",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "#fff", fontWeight: 600 }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0] && payload[0].payload) {
                  const data = payload[0].payload;
                  return `${data.name} ${data.year}`;
                }
                return label;
              }}
              formatter={(value: number) =>
                `${currencySymbol}${value.toLocaleString()}`
              }
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#4dabf7"
              strokeWidth={2}
              fill="url(#colorIncome)"
            />
            <Area
              type="monotone"
              dataKey="spending"
              stroke="#fa5252"
              strokeWidth={2}
              fill="url(#colorSpending)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
