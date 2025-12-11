"use client";

import { useEffect, useState } from "react";
import { useTransaction } from "@/hooks/useTransactions";
import { useGoals } from "@/hooks/useGoals";
import { useBills } from "@/hooks/useBills";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { MetricCard } from "./MetricCardClient";
import { SpendingChart } from "@/components/SpendingChart";
import { ExpenseBreakdownChart } from "@/components/ExpenseBreakdownChart";
import { TransactionListSimple } from "@/components/TransactionListSimple";
import { RecurringBills } from "@/components/RecurringBillsSimple";
import { GoalsSectionSimple } from "@/components/GoalsSectionSimple";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PeriodSelector } from "./PeriodSelector";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Target 
} from "lucide-react";
import { 
  Transaction, 
  Goal, 
  Category, 
  Account, 
  UserSettings 
} from "@/types";
import { RecurringBill } from "@/hooks/useBills";

type DashboardClientProps = {
  userId: string;
  initialTransactions: Transaction[];
  initialGoals: Goal[];
  initialBills: RecurringBill[];
  initialCategories: Category[];
  initialAccounts: Account[];
  settings: UserSettings | null;
};

export default function DashboardClient({
  userId,
  initialTransactions,
  initialGoals,
  initialBills,
  initialCategories,
  initialAccounts,
  settings,
}: DashboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  // Hydrate hooks
  const { transactions, addTransaction } = useTransaction(initialTransactions);
  const { goals } = useGoals(initialGoals);
  const { bills } = useBills(initialBills);
  const { categories } = useCategories(initialCategories);
  const { accounts } = useAccounts(initialAccounts);
  
  // We can use settings directly or via hook if we want to support updates
  // For now, let's just use the prop for currency
  const currencySymbol = settings?.currency_symbol || "$";

  // Calculate metrics based on selectedPeriod
  const calculateMetrics = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let filteredTransactions = transactions;

    if (selectedPeriod === "current-month") {
      filteredTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === "last-month") {
       const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
       const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
       filteredTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      });
    }
    
    // Total Balance is sum of all accounts, not transactions
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const income = filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expense = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const savings = income - expense;

    return { totalBalance, income, expense, savings };
  };

  const metrics = calculateMetrics();

  const periodOptions = [
    { value: "current-month", label: "Current Month" },
    { value: "last-month", label: "Last Month" },
    { value: "last-3-months", label: "Last 3 Months" },
    { value: "last-6-months", label: "Last 6 Months" },
    { value: "last-year", label: "Last Year" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your financial overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={periodOptions}
          />
          <Button onClick={() => setIsAddTransactionOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Balance"
          value={`${currencySymbol}${metrics.totalBalance.toLocaleString()}`}
          icon={Wallet}
          change="vs last month" // Placeholder
          changeType="neutral"
          className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20"
        />
        <MetricCard
          title="Income"
          value={`${currencySymbol}${metrics.income.toLocaleString()}`}
          icon={ArrowUpCircle}
          iconColor="text-emerald-500"
          change="vs last month" // Placeholder
          changeType="neutral"
          className="bg-emerald-500/5 border-emerald-500/20"
        />
        <MetricCard
          title="Expenses"
          value={`${currencySymbol}${metrics.expense.toLocaleString()}`}
          icon={ArrowDownCircle}
          iconColor="text-rose-500"
          change="vs last month" // Placeholder
          changeType="neutral"
          className="bg-rose-500/5 border-rose-500/20"
        />
        <MetricCard
          title="Savings"
          value={`${currencySymbol}${metrics.savings.toLocaleString()}`}
          icon={Target}
          iconColor="text-indigo-500"
          change="vs last month" // Placeholder
          changeType="neutral"
          className="bg-indigo-500/5 border-indigo-500/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart 
          currencySymbol={currencySymbol} 
          transactions={transactions} 
        />
        <ExpenseBreakdownChart
          selectedPeriod={selectedPeriod}
          currencySymbol={currencySymbol}
          transactions={transactions}
          categories={categories}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionListSimple 
            transactions={transactions} 
            accounts={accounts}
            currencySymbol={currencySymbol} 
          />
        </div>
        <div className="space-y-6">
          <RecurringBills 
            currencySymbol={currencySymbol} 
            bills={bills}
          />
          <GoalsSectionSimple goals={goals} />
        </div>
      </div>

      <AddTransactionDialog
        open={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
        categories={categories}
        accounts={accounts}
        goals={goals}
        onAddTransaction={(newTransaction) => {
          addTransaction(newTransaction);
          setIsAddTransactionOpen(false);
        }}
      />
    </div>
  );
}
