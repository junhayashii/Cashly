"use client";

import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTransaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PeriodComparisonProps = {
  currencySymbol: string;
};

export const PeriodComparison = ({ currencySymbol }: PeriodComparisonProps) => {
  const { transactions } = useTransaction();
  const { categories } = useCategories();

  const [month1, setMonth1] = useState(dayjs().month());
  const [month2, setMonth2] = useState(dayjs().subtract(1, "month").month());

  // 月選択肢（直近12ヶ月）
  const monthlyOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = dayjs().subtract(i, "month");
      return {
        label: date.format("YYYY年 MMM"),
        month: date.month(),
        year: date.year(),
      };
    }).reverse();
  }, []);

  const data = useMemo(() => {
    if (!transactions || !categories) return [];

    // 指定月のトランザクションをカテゴリ単位で集計
    const aggregateMonth = (month: number, year: number) => {
      const result: Record<string, number> = {};

      transactions.forEach((t) => {
        const d = dayjs(t.date);
        if (
          d.month() === month &&
          d.year() === year &&
          t.type === "expense" &&
          t.category_id
        ) {
          const category = categories.find((c) => c.id === t.category_id);
          if (!category) return;

          result[category.name] =
            (result[category.name] || 0) + Math.abs(t.amount);
        }
      });

      return result;
    };

    const m1Option = monthlyOptions.find((o) => o.month === month1);
    const m2Option = monthlyOptions.find((o) => o.month === month2);

    if (!m1Option || !m2Option) return [];

    const month1Data = aggregateMonth(month1, m1Option.year);
    const month2Data = aggregateMonth(month2, m2Option.year);

    const categoriesSet = new Set([
      ...Object.keys(month1Data),
      ...Object.keys(month2Data),
    ]);

    return Array.from(categoriesSet).map((cat) => ({
      category: cat,
      [dayjs().month(month1).format("MMM")]: month1Data[cat] || 0,
      [dayjs().month(month2).format("MMM")]: month2Data[cat] || 0,
    }));
  }, [transactions, categories, month1, month2, monthlyOptions]);

  const month1Label = dayjs().month(month1).format("MMM");
  const month2Label = dayjs().month(month2).format("MMM");

  return (
    <Card className="p-6 bg-card border-border animate-fade-in h-[28rem] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Category Comparison
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compare category spending between two months
          </p>
        </div>

        <div className="flex gap-4">
          <Select
            value={month1.toString()}
            onValueChange={(val) => setMonth1(Number(val))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Month 1" />
            </SelectTrigger>
            <SelectContent>
              {monthlyOptions.map((opt) => (
                <SelectItem key={opt.label} value={opt.month.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={month2.toString()}
            onValueChange={(val) => setMonth2(Number(val))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Month 2" />
            </SelectTrigger>
            <SelectContent>
              {monthlyOptions.map((opt) => (
                <SelectItem key={opt.label} value={opt.month.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="category"
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
            />
            <YAxis
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${currencySymbol}${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f1f1f",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff", fontWeight: 600 }}
              formatter={(value: number) =>
                `${currencySymbol}${value.toLocaleString()}`
              }
            />
            <Legend />
            <Bar
              dataKey={month1Label}
              fill="#4dabf7"
              name={`${month1Label}`}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey={month2Label}
              fill="#fa5252"
              name={`${month2Label}`}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
