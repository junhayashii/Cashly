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
  { name: "Mar", spending: 2800, income: 4500 },
  { name: "Apr", spending: 3908, income: 4200 },
  { name: "May", spending: 2600, income: 5000 },
  { name: "Jun", spending: 3200, income: 4800 },
  { name: "Jul", spending: 2900, income: 5200 },
];

export function SpendingChart() {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">
        Spending Overview
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(217 91% 60%)"
                stopOpacity={0.3}
              />
              <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(262 83% 58%)"
                stopOpacity={0.3}
              />
              <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
          <XAxis dataKey="name" stroke="hsl(240 5% 65%)" />
          <YAxis stroke="hsl(240 5% 65%)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(240 10% 7%)",
              border: "1px solid hsl(240 6% 20%)",
              borderRadius: "0.75rem",
              color: "hsl(0 0% 98%)",
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="hsl(217 91% 60%)"
            fillOpacity={1}
            fill="url(#colorIncome)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="spending"
            stroke="hsl(262 83% 58%)"
            fillOpacity={1}
            fill="url(#colorSpending)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-sm text-muted-foreground">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent"></div>
          <span className="text-sm text-muted-foreground">Spending</span>
        </div>
      </div>
    </Card>
  );
}
