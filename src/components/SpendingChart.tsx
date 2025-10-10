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

const data = [
  { name: "Jan", spending: 2400, income: 4000 },
  { name: "Feb", spending: 1398, income: 3000 },
  { name: "Mar", spending: 3800, income: 4500 },
  { name: "Apr", spending: 3908, income: 4200 },
  { name: "May", spending: 2800, income: 3800 },
  { name: "Jun", spending: 3200, income: 4300 },
  { name: "Jul", spending: 3500, income: 4600 },
  { name: "Aug", spending: 3500, income: 4600 },
  { name: "Sep", spending: 3500, income: 4600 },
  { name: "Oct", spending: 3500, income: 4600 },
];

interface SpendingChartProps {
  selectedPeriod?: string;
}

export const SpendingChart = ({ selectedPeriod = "current-month" }: SpendingChartProps) => {
  return (
    <Card className="p-6 bg-card border-border animate-fade-in h-[24rem] flex flex-col">
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
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f1f1f",
                border: "1px solid #333",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "#fff", fontWeight: 600 }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
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
