"use client";

import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

import { Transaction } from "@/types";
import { useTransaction } from "@/hooks/useTransactions";

const TransactionPage = () => {
  const { transactions, loading, setTransactions } = useTransaction();

  const handleAddTransaction = async (newTransaction: Transaction) => {
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
          <p className="text-sm text-muted-foreground mb-2">Balance</p>
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
      {loading ? (
        <div>Loading transactions...</div>
      ) : (
        <TransactionList transactions={transactions} />
      )}
    </div>
  );
};

export default TransactionPage;
