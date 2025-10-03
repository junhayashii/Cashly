"use client";

import { useState } from "react";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

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
  {
    id: "7",
    title: "Netflix Subscription",
    category: "Entertainment",
    amount: -15.99,
    date: "Nov 26, 2025",
    type: "expense",
  },
  {
    id: "8",
    title: "Coffee Shop",
    category: "Dining",
    amount: -12.5,
    date: "Nov 25, 2025",
    type: "expense",
  },
];

const TransactionPage = () => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  const handleAddTransaction = (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netFlow = totalIncome - totalExpenses;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Transactions
          </h2>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <AddTransactionDialog onAddTransaction={handleAddTransaction} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground mb-2">Total Income</p>
          <p className="text-2xl font-bold text-success">
            ${totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
          <p className="text-2xl font-bold text-destructive">
            ${totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground mb-2">Net Flow</p>
          <p
            className={`text-2xl font-bold ${
              netFlow >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            ${netFlow.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <TransactionList transactions={transactions} />
    </div>
  );
};

export default TransactionPage;
