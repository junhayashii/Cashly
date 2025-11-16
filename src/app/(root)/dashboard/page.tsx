"use client";
import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { TransactionList } from "@/components/TransactionList";
import { TransactionListSimple } from "@/components/TransactionListSimple";
import { SpendingChart } from "@/components/SpendingChart";
import { BudgetSection } from "@/components/BudgetSection";
import { GoalsSectionSimple } from "@/components/GoalsSectionSimple";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { RecurringBills } from "@/components/RecurringBillsSimple";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Download,
  Calendar,
  Plus,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

import { Transaction } from "@/types";
import { useTransaction } from "@/hooks/useTransactions";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ExpenseBreakdownChart } from "@/components/ExpenseBreakdownChart";
import { BudgetSectionSimple } from "@/components/BudgetSectionSimple";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useGoals } from "@/hooks/useGoals";

const Dashboard = () => {
  const { transactions, setTransactions } = useTransaction();
  const { state: sidebarState, isMobile } = useSidebar();

  const [userId, setUserId] = useState<string | null>(null);
  const [isBelow1400, setIsBelow1400] = useState(false);

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
  const { getTotalCurrent: getTotalSavingsFromGoals } = useGoals();

  const [firstName, setFirstName] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current-month");

  const currencySymbol = settings?.currency === "BRL" ? "R$" : "$";

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

      if (user) {
        setFirstName(user.user_metadata?.first_name || "User");
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1399px)");
    const onChange = (event: MediaQueryListEvent) => setIsBelow1400(event.matches);
    setIsBelow1400(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const sidebarForcesNarrowLayout =
    sidebarState === "expanded" && isBelow1400;
  const isSidebarCollapsed = sidebarState === "collapsed";
  const metricsGridClass = sidebarForcesNarrowLayout
    ? "grid grid-cols-1 min-[850px]:grid-cols-2 min-[1400px]:grid-cols-4 gap-6"
    : "grid grid-cols-1 min-[850px]:grid-cols-2 lg:grid-cols-4 gap-6";
  const topChartsGridClass = sidebarForcesNarrowLayout
    ? "grid grid-cols-1 min-[1250px]:grid-cols-2 gap-6"
    : "grid grid-cols-1 lg:grid-cols-2 gap-6";
  const bottomGridClass = sidebarForcesNarrowLayout
    ? "grid grid-cols-1 min-[1225px]:grid-cols-[1.15fr_0.95fr_0.9fr] min-[1400px]:grid-cols-3 gap-6"
    : "grid grid-cols-1 lg:grid-cols-3 gap-6";
  const headerClass = isMobile
    ? "flex items-center justify-between pl-12"
    : "flex items-center justify-between";
  const useCompactPeriodLabels = isMobile;
  const periodLabels = useCompactPeriodLabels
    ? {
        "current-month": "This Mo.",
        "last-month": "Last Mo.",
        "last-3-months": "Last 3M",
        "last-6-months": "Last 6M",
        "last-year": "Last Yr",
      }
    : {
        "current-month": "This Month",
        "last-month": "Last Month",
        "last-3-months": "Last 3 Months",
        "last-6-months": "Last 6 Months",
        "last-year": "Last Year",
      };
  const periodSelectWidth = useCompactPeriodLabels ? "w-16" : "w-40";
  const periodSelectAriaLabel =
    periodLabels[selectedPeriod] ?? "Select period";

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

  const handleAddTransaction = async (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const totalBalance = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const monthlyIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const monthlyExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const monthlySavings = filteredTransactions
    .filter((t) => t.type === "savings")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const goalSavings = getTotalSavingsFromGoals();
  const totalSavings = goalSavings > 0 ? goalSavings : monthlySavings;

  return (
    <ProtectedRoute>
      <div className="space-y-6 h-[95vh]">
        {/* Welcome Section */}
        <div className={headerClass}>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}
            </h2>
            <p className="text-muted-foreground">Your financial overview</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              aria-label={periodSelectAriaLabel}
            >
              <SelectTrigger
                className={`${periodSelectWidth} justify-between px-2 ${
                  useCompactPeriodLabels ? "ml-2" : ""
                }`}
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {useCompactPeriodLabels ? (
                  <span className="sr-only">{periodSelectAriaLabel}</span>
                ) : (
                  <SelectValue placeholder="Select period" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">
                  {periodLabels["current-month"]}
                </SelectItem>
                <SelectItem value="last-month">
                  {periodLabels["last-month"]}
                </SelectItem>
                <SelectItem value="last-3-months">
                  {periodLabels["last-3-months"]}
                </SelectItem>
                <SelectItem value="last-6-months">
                  {periodLabels["last-6-months"]}
                </SelectItem>
                <SelectItem value="last-year">
                  {periodLabels["last-year"]}
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:block">
              <AddTransactionDialog onAddTransaction={handleAddTransaction} />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={metricsGridClass}>
          <MetricCard
            title="Total Balance"
            value={`${currencySymbol}${totalBalance.toFixed(2)}`}
            change="+12.5% from last month"
            changeType="positive"
            icon={Wallet}
            iconColor="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Monthly Income"
            value={`${currencySymbol}${monthlyIncome.toFixed(2)}`}
            change="+8.2% from last month"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Monthly Expenses"
            value={`${currencySymbol}${monthlyExpenses.toFixed(2)}`}
            change="-5.4% from last month"
            changeType="negative"
            icon={TrendingDown}
            iconColor="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Total Savings"
            value={`${currencySymbol}${totalSavings.toFixed(2)}`}
            change="+15.8% from last month"
            changeType="positive"
            icon={PiggyBank}
            iconColor="bg-primary/10 text-primary"
          />
        </div>

        {/* Overview Section */}
        <div className={topChartsGridClass}>
          {/* 上段 */}
          <div>
            <SpendingChart
              selectedPeriod={selectedPeriod}
              currencySymbol={currencySymbol}
            />
          </div>

          <div>
            <ExpenseBreakdownChart
              selectedPeriod={selectedPeriod}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>

        <div className={bottomGridClass}>
          {/* 下段 */}
          <div>
            <TransactionListSimple
              transactions={filteredTransactions}
              currencySymbol={currencySymbol}
            />
          </div>
          <div>
            <RecurringBills currencySymbol={currencySymbol} />
          </div>
          <div>
            <GoalsSectionSimple />
          </div>
        </div>
        <div className="sm:hidden fixed bottom-4 right-4 z-50">
          <AddTransactionDialog
            onAddTransaction={handleAddTransaction}
            trigger={
              <Button className="h-12 w-12 rounded-full shadow-lg shadow-primary/40 bg-primary text-primary-foreground">
                <Plus className="h-6 w-6" />
              </Button>
            }
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
