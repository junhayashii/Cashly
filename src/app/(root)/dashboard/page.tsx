"use client";
import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { TransactionList } from "@/components/TransactionList";
import { TransactionListSimple } from "@/components/TransactionListSimple";
import { SpendingChart } from "@/components/SpendingChart";
import { BudgetSection } from "@/components/BudgetSection";
import { GoalsSectionSimple } from "@/components/GoalsSectionSimple";
import { RecurringBills } from "@/components/RecurringBillsSimple";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

import { Transaction } from "@/types";
import { useTransaction } from "@/hooks/useTransactions";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ExpenseBreakdownChart } from "@/components/ExpenseBreakdownChart";
import { BudgetSectionSimple } from "@/components/BudgetSectionSimple";
import { useUserSettings } from "@/hooks/useUserSettings";

const Dashboard = () => {
  const { transactions, setTransactions } = useTransaction();

  const [userId, setUserId] = useState<string | null>(null);

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

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}
            </h2>
            <p className="text-muted-foreground">Your financial overview</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AddTransactionDialog onAddTransaction={handleAddTransaction} />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            value={`${currencySymbol}${monthlySavings.toFixed(2)}`}
            change="+15.8% from last month"
            changeType="positive"
            icon={PiggyBank}
            iconColor="bg-primary/10 text-primary"
          />
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 上段 */}
          <div className="lg:col-span-2">
            <SpendingChart
              selectedPeriod={selectedPeriod}
              currencySymbol={currencySymbol}
            />
          </div>

          <div className="lg:col-span-2">
            <ExpenseBreakdownChart
              selectedPeriod={selectedPeriod}
              currencySymbol={currencySymbol}
            />
          </div>

          {/* 下段 */}
          <div className="lg:col-span-2">
            <TransactionListSimple
              transactions={filteredTransactions}
              currencySymbol={currencySymbol}
            />
          </div>
          <div className="lg:col-span-1">
            <RecurringBills currencySymbol={currencySymbol} />
          </div>
          <div className="lg:col-span-1">
            <GoalsSectionSimple />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
