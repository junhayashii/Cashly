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

const createOptionValue = (year: number, month: number) => `${year}-${month}`;
const parseOptionValue = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
};
const getMonthLabel = (selection: { year: number; month: number }) =>
  dayjs(new Date(selection.year, selection.month, 1)).format("MMM");

export const PeriodComparison = ({ currencySymbol }: PeriodComparisonProps) => {
  const { transactions } = useTransaction();
  const { categories } = useCategories();

  const currentMonth = dayjs();
  const previousMonth = dayjs().subtract(1, "month");

  const [month1, setMonth1] = useState({
    month: currentMonth.month(),
    year: currentMonth.year(),
  });
  const [month2, setMonth2] = useState({
    month: previousMonth.month(),
    year: previousMonth.year(),
  });

  // 月選択肢（直近12ヶ月）
  const monthlyOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = dayjs().subtract(i, "month");
      return {
        label: date.format("YYYY年 MMM"),
        month: date.month(),
        year: date.year(),
        value: createOptionValue(date.year(), date.month()),
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

    const month1Data = aggregateMonth(month1.month, month1.year);
    const month2Data = aggregateMonth(month2.month, month2.year);

    const categoriesSet = new Set([
      ...Object.keys(month1Data),
      ...Object.keys(month2Data),
    ]);

    const month1Label = getMonthLabel(month1);
    const month2Label = getMonthLabel(month2);

    return Array.from(categoriesSet).map((cat) => ({
      category: cat,
      [month1Label]: month1Data[cat] || 0,
      [month2Label]: month2Data[cat] || 0,
    }));
  }, [transactions, categories, month1, month2]);

  const month1Label = getMonthLabel(month1);
  const month2Label = getMonthLabel(month2);

  return (
    <Card className="flex h-full min-h-[26rem] flex-col border border-border/40 bg-background/60 p-6 shadow-sm backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-8 border-b border-border/40">
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
            value={createOptionValue(month1.year, month1.month)}
            onValueChange={(val) => setMonth1(parseOptionValue(val))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Month 1" />
            </SelectTrigger>
            <SelectContent>
              {monthlyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={createOptionValue(month2.year, month2.month)}
            onValueChange={(val) => setMonth2(parseOptionValue(val))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Month 2" />
            </SelectTrigger>
            <SelectContent>
              {monthlyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
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
