"use client";
import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { TransactionList } from "@/components/TransactionList";
import { SpendingChart } from "@/components/SpendingChart";
import { BudgetSection } from "@/components/BudgetSection";
import { GoalsSection } from "@/components/GoalsSection";
import { RecurringBills } from "@/components/RecurringBills";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Download,
  Send,
  BarChart3,
} from "lucide-react";

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
}

const initialTransactions: Transaction[] = [
  {
    id: "1",
    title: "Salary Deposit",
    category: "Salary",
    amount: 5420.0,
    date: "Dec 1, 2025",
    type: "income",
  },
  {
    id: "2",
    title: "Grocery Shopping",
    category: "Food",
    amount: -142.5,
    date: "Nov 30, 2025",
    type: "expense",
  },
  {
    id: "3",
    title: "Rent Payment",
    category: "Housing",
    amount: -1200.0,
    date: "Nov 30, 2025",
    type: "expense",
  },
  {
    id: "4",
    title: "Restaurant",
    category: "Dining",
    amount: -85.3,
    date: "Nov 29, 2025",
    type: "expense",
  },
  {
    id: "5",
    title: "Fuel",
    category: "Transport",
    amount: -65.0,
    date: "Nov 28, 2025",
    type: "expense",
  },
  {
    id: "6",
    title: "Freelance Project",
    category: "Freelance",
    amount: 850.0,
    date: "Nov 27, 2025",
    type: "income",
  },
];

const Home = () => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  const handleAddTransaction = (newTransaction: Transaction) => {
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Alex
          </h2>
          <p className="text-muted-foreground">
            Here's your financial overview for December 2025
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
          iconColor="bg-success/10 text-success"
        />
        <MetricCard
          title="Monthly Expenses"
          value={`$${monthlyExpenses.toFixed(2)}`}
          change="-5.4% from last month"
          changeType="positive"
          icon={TrendingDown}
          iconColor="bg-accent/10 text-accent"
        />
        <MetricCard
          title="Total Savings"
          value="$18,420.00"
          change="+15.8% from last month"
          changeType="positive"
          icon={PiggyBank}
          iconColor="bg-warning/10 text-warning"
        />
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="budgets" className="gap-2">
            <Wallet className="h-4 w-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <PiggyBank className="h-4 w-4" />
            Goals
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SpendingChart />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
                >
                  <Send className="h-6 w-6" />
                  <span className="text-sm font-medium">Send Money</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2 hover:bg-success/10 hover:text-success hover:border-success"
                >
                  <Download className="h-6 w-6" />
                  <span className="text-sm font-medium">Request</span>
                </Button>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                <h3 className="text-lg font-bold mb-2">Premium Plan</h3>
                <p className="text-sm opacity-90 mb-4">
                  Unlock advanced analytics and insights
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecurringBills />
            <GoalsSection />
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <TransactionList transactions={transactions} />
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetSection />
            <div className="space-y-6">
              <SpendingChart />
            </div>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoalsSection />
            <div className="p-6 rounded-xl bg-card border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Tips for Achieving Your Goals
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-2">
                    Automate Your Savings
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Set up automatic transfers to your savings goals each month
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                  <h4 className="font-semibold text-foreground mb-2">
                    Track Your Progress
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Review your goals weekly to stay motivated and on track
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <h4 className="font-semibold text-foreground mb-2">
                    Celebrate Milestones
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Reward yourself when you reach 25%, 50%, and 75% of your
                    goal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
