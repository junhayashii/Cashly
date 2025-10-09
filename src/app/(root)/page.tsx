"use client";
import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { TransactionList } from "@/components/TransactionList";
import { SpendingChart } from "@/components/SpendingChart";
import { BudgetSection } from "@/components/BudgetSection";
import { GoalsSection } from "@/components/GoalsSection";
import { RecurringBills } from "@/components/RecurringBills";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Download,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

import { Transaction } from "@/types";
import { useTransaction } from "@/hooks/useTransactions";

import ProtectedRoute from "@/components/ProtectedRoute";

const Home = () => {
  const { transactions, setTransactions } = useTransaction();
  const [firstName, setFirstName] = useState<string>("");

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

  const handleAddTransaction = async (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 24568.9);
  const monthlyIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const monthlyExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}
            </h2>
            <p className="text-muted-foreground">
              Your financial overview for December 2025
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <AddTransactionDialog onAddTransaction={handleAddTransaction} />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Balance"
            value={`$${totalBalance.toFixed(2)}`}
            change="+12.5% from last month"
            changeType="positive"
            icon={Wallet}
            iconColor="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Monthly Income"
            value={`$${monthlyIncome.toFixed(2)}`}
            change="+8.2% from last month"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Monthly Expenses"
            value={`$${monthlyExpenses.toFixed(2)}`}
            change="-5.4% from last month"
            changeType="negative"
            icon={TrendingDown}
            iconColor="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Total Savings"
            value="$18,420.00"
            change="+15.8% from last month"
            changeType="positive"
            icon={PiggyBank}
            iconColor="bg-primary/10 text-primary"
          />
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SpendingChart />
            <TransactionList transactions={transactions} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <BudgetSection />
            <RecurringBills />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Home;
