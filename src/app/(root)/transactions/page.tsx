"use client";

import { useState, useEffect } from "react";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

import { Transaction } from "@/types";
import { useTransaction } from "@/hooks/useTransactions";
import RecurringBills from "@/components/RecurringBills";
import { supabase } from "@/lib/supabaseClient";
import { useUserSettings } from "@/hooks/useUserSettings";

import { exportTransactionsCSV } from "@/components/exportTransactionsCSV";

const TransactionPage = () => {
  const { transactions, loading, setTransactions } = useTransaction();

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

  const currencySymbol = settings?.currency === "BRL" ? "R$" : "$";

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
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 pb-8">
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
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={exportTransactionsCSV(transactions, `transactions.csv`)}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <AddTransactionDialog onAddTransaction={handleAddTransaction} />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-full flex-[3]">
            <div>Loading transactions...</div>
          </div>
        ) : (
          <div className="flex-[3]">
            <TransactionList
              transactions={transactions}
              currencySymbol={currencySymbol}
              onTransactionUpdated={(updated) =>
                setTransactions((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                )
              }
              onTransactionDeleted={(deletedId) =>
                setTransactions((prev) =>
                  prev.filter((t) => t.id !== deletedId)
                )
              }
            />
          </div>
        )}
        <div className="flex-[2]">
          <RecurringBills currencySymbol={currencySymbol} />
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
