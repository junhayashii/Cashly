"use client";
import { BudgetSection } from "@/components/BudgetSection";
import { SpendingChart } from "@/components/SpendingChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Download } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useTransaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { buildReportsInsightFallback } from "@/lib/reportsInsightFallback";
import dayjs from "dayjs";
import { TransactionList } from "@/components/TransactionList";
import { PeriodComparison } from "@/components/PeriodComparison";
import type { Transaction } from "@/types";
import {
  generateReportsPdf,
  type ExpenseCategoryStat,
  type ReportQuickStats,
} from "@/lib/generateReportsPdf";

const ReportsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (user) setUserId(user.id);
    };

    fetchUser();
  }, []);

  const { settings } = useUserSettings(userId || undefined);
  const { transactions } = useTransaction();
  const { categories } = useCategories();

  // Month selector in format YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs().format("YYYY-MM")
  );

  const periodLabel = useMemo(() => {
    const d = dayjs(selectedMonth + "-01");
    return d.format("MMMM YYYY");
  }, [selectedMonth]);

  const periodStart = useMemo(
    () => dayjs(selectedMonth + "-01").startOf("month"),
    [selectedMonth]
  );
  const periodEnd = useMemo(
    () => dayjs(selectedMonth + "-01").endOf("month"),
    [selectedMonth]
  );

  const periodStartISO = useMemo(
    () => periodStart.format("YYYY-MM-DD"),
    [periodStart]
  );
  const periodEndISO = useMemo(
    () => periodEnd.format("YYYY-MM-DD"),
    [periodEnd]
  );

  const periodTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t) => {
      const d = dayjs(t.date);
      return d.isSame(periodStart, "month") && d.isSame(periodStart, "year");
    });
  }, [transactions, periodStart]);

  // Quick stats derived from DB
  const quickStats = useMemo<ReportQuickStats>(() => {
    if (!periodTransactions || periodTransactions.length === 0) {
      return {
        avgDailySpending: 0,
        largestExpenseAmount: 0,
        largestExpenseTitle: "-",
        topCategoryName: "-",
        topCategoryPercent: 0,
        savingsRatePercent: 0,
        totalExpense: 0,
        totalIncome: 0,
      };
    }

    const daysInMonth = periodEnd.daysInMonth();
    const expenses = periodTransactions.filter((t) => t.type === "expense");
    const income = periodTransactions.filter((t) => t.type === "income");

    const totalExpense = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalIncome = income.reduce((s, t) => s + t.amount, 0);

    const avgDailySpending = totalExpense / daysInMonth;

    const largestExpense = expenses.reduce<Transaction | undefined>(
      (max, t) => (Math.abs(t.amount) > Math.abs(max?.amount ?? 0) ? t : max),
      undefined
    );
    const largestExpenseAmount = largestExpense
      ? Math.abs(largestExpense.amount)
      : 0;
    const largestExpenseTitle = largestExpense?.title || "-";

    // Top category by expense sum
    const categoryIdToTotal: Record<string, number> = {};
    for (const t of expenses) {
      const key = String(t.category_id);
      categoryIdToTotal[key] =
        (categoryIdToTotal[key] || 0) + Math.abs(t.amount);
    }
    let topCategoryId: string | null = null;
    let topCategoryTotal = 0;
    for (const [cid, sum] of Object.entries(categoryIdToTotal)) {
      if (sum > topCategoryTotal) {
        topCategoryTotal = sum;
        topCategoryId = cid;
      }
    }
    const topCategory = categories.find(
      (c) => String(c.id) === String(topCategoryId)
    );
    const topCategoryName = topCategory?.name || "-";
    const topCategoryPercent =
      totalExpense > 0 ? (topCategoryTotal / totalExpense) * 100 : 0;

    const savings = Math.max(totalIncome - totalExpense, 0);
    const savingsRatePercent =
      totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    return {
      avgDailySpending,
      largestExpenseAmount,
      largestExpenseTitle,
      topCategoryName,
      topCategoryPercent,
      savingsRatePercent,
      totalExpense,
      totalIncome,
    };
  }, [periodTransactions, periodEnd, categories]);

  const currencySymbol = settings?.currency === "BRL" ? "R$" : "$";

  const insightInput = useMemo(
    () => ({
      periodLabel,
      currencySymbol,
      avgDailySpending: quickStats.avgDailySpending,
      largestExpenseTitle: quickStats.largestExpenseTitle,
      largestExpenseAmount: quickStats.largestExpenseAmount,
      topCategoryName: quickStats.topCategoryName,
      topCategoryPercent: quickStats.topCategoryPercent,
      savingsRatePercent: quickStats.savingsRatePercent,
      totalIncome: quickStats.totalIncome,
      totalExpense: quickStats.totalExpense,
    }),
    [periodLabel, currencySymbol, quickStats]
  );

  const fallbackInsight = useMemo(
    () => buildReportsInsightFallback(insightInput),
    [insightInput]
  );

  const [smartInsight, setSmartInsight] = useState<string>(fallbackInsight);

  const expenseCategoryStats = useMemo<ExpenseCategoryStat[]>(() => {
    if (!periodTransactions || periodTransactions.length === 0) return [];
    const categoryList = categories ?? [];

    const totals = periodTransactions.reduce<Record<string, number>>(
      (acc, transaction) => {
        if (transaction.type !== "expense") return acc;
        const key = String(transaction.category_id ?? "uncategorized");
        acc[key] = (acc[key] || 0) + Math.abs(transaction.amount);
        return acc;
      },
      {}
    );

    return Object.entries(totals)
      .map(([categoryId, spent]) => {
        const category = categoryList.find(
          (c) => String(c.id) === String(categoryId)
        );
        return {
          name: category?.name || "Other",
          spent,
          percent:
            quickStats.totalExpense > 0
              ? (spent / quickStats.totalExpense) * 100
              : 0,
        };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [periodTransactions, categories, quickStats.totalExpense]);

  useEffect(() => {
    let isMounted = true;

    setSmartInsight(fallbackInsight);

    if (!periodTransactions || periodTransactions.length === 0) {
      return () => {
        isMounted = false;
      };
    }

    const fetchInsight = async () => {
      try {
        const response = await fetch("/api/reports/smart-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(insightInput),
        });

        if (!isMounted) return;

        if (!response.ok) {
          console.warn(
            "[Reports] Smart insight request failed with non-OK response.",
            response.status
          );
          setSmartInsight(fallbackInsight);
          return;
        }

        const data = (await response.json()) as { line?: string };
        const line = (data?.line ?? "").trim();
        setSmartInsight(line || fallbackInsight);
      } catch (error) {
        console.warn("[Reports] Failed to fetch smart insight.", error);
        if (isMounted) {
          setSmartInsight(fallbackInsight);
        }
      }
    };

    void fetchInsight();

    return () => {
      isMounted = false;
    };
  }, [fallbackInsight, insightInput, periodTransactions]);

  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      await generateReportsPdf({
        periodLabel,
        selectedMonth,
        currencySymbol,
        quickStats,
        insight: smartInsight || fallbackInsight,
        transactions: periodTransactions,
        expenseCategoryStats,
      });
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="report-section" className="space-y-8">
      {/* Title + Period Selector*/}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground">
            Detailed insights into your financial habits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="month" className="text-sm text-muted-foreground">
            Period
          </label>
          <input
            id="month"
            type="month"
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Generating..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Charts Section */}

      {/* Spending Insights */}
      <Alert className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          <strong>📝 レポートまとめ:</strong> {smartInsight || fallbackInsight}
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Daily Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencySymbol}
              {quickStats.avgDailySpending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Largest Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencySymbol}
              {quickStats.largestExpenseAmount.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {quickStats.largestExpenseTitle}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quickStats.topCategoryName}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {quickStats.topCategoryPercent.toFixed(0)}% of expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quickStats.savingsRatePercent.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SpendingChart currencySymbol={currencySymbol} />
            <PeriodComparison currencySymbol={currencySymbol} />
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <TransactionList
            transactions={transactions || []}
            currencySymbol={currencySymbol}
            initialStartDate={periodStartISO}
            initialEndDate={periodEndISO}
          />
        </div>
        <div className="lg:col-span-1 h-full">
          <BudgetSection
            currencySymbol={currencySymbol}
            year={dayjs(selectedMonth + "-01").year()}
            month={dayjs(selectedMonth + "-01").month() + 1}
            label={periodLabel}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
