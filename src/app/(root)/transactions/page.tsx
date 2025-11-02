"use client";

import { useState, useEffect } from "react";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Clock3,
  CalendarDays,
  CreditCard,
  Repeat,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Wallet,
} from "lucide-react";

import { Transaction } from "@/types";
import { useTransaction } from "@/hooks/useTransactions";
import { useCreditCardPayments } from "@/hooks/useCreditCardPayments";
import UpcomingBills from "@/components/UpcomingBills";
import { useBills } from "@/hooks/useBills";
import { RecurringBillsManageTable } from "@/components/RecurringBillsManageTable";
import { supabase } from "@/lib/supabaseClient";
import { useUserSettings } from "@/hooks/useUserSettings";

import { exportTransactionsCSV } from "@/components/exportTransactionsCSV";
import { CreditCardPaymentsList } from "@/components/CreditCardPaymentsList";
import { ImportTransactionsDialog } from "@/components/ImportTransactionsDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MetricCard } from "@/components/MetricCard";

const TransactionPage = () => {
  const { transactions, loading, setTransactions } = useTransaction();

  const billsHook = useBills();
  const creditHook = useCreditCardPayments();
  const { payments, refresh: refreshPayments } = creditHook;

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

  // Calculate transaction count by type for metrics
  const incomeCount = transactions.filter((t) => t.type === "income").length;
  const expenseCount = transactions.filter((t) => t.type === "expense").length;
  const totalCount = transactions.length;

  return (
    <div className="flex h-[95vh] w-full flex-col gap-4 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-shrink-0 flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-3xl font-bold text-foreground">
              Transactions
            </h2>
            <p className="text-sm text-muted-foreground">
              View and manage all your transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ImportTransactionsDialog />
            <AddTransactionDialog onAddTransaction={handleAddTransaction} />
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="recent"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <TabsList className="w-full flex-shrink-0 justify-start gap-2 overflow-x-auto bg-background/60 px-2 backdrop-blur-sm">
          <TabsTrigger value="recent" className="flex-1 sm:flex-initial">
            <Clock3 className="h-4 w-4" />
            <span>Recent</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-initial">
            <CalendarDays className="h-4 w-4" />
            <span>Upcoming</span>
          </TabsTrigger>
          <TabsTrigger value="credit-cards" className="flex-1 sm:flex-initial">
            <CreditCard className="h-4 w-4" />
            <span>Credit Cards</span>
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex-1 sm:flex-initial">
            <Repeat className="h-4 w-4" />
            <span>Recurring</span>
          </TabsTrigger>
        </TabsList>

        <div className="w-full flex-1 overflow-hidden px-1 py-2 sm:px-0 sm:py-3 min-h-0">
          <TabsContent
            value="recent"
            className="flex h-full w-full flex-col overflow-hidden min-h-0"
          >
            {loading ? (
              <div className="flex w-full items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"></div>
                  <p className="text-sm">Loading transactions...</p>
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-1 min-h-0">
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
          </TabsContent>

          <TabsContent
            value="upcoming"
            className="flex h-full w-full flex-col overflow-hidden min-h-0"
          >
            <UpcomingBills
              currencySymbol={currencySymbol}
              billsHook={billsHook}
              creditHook={creditHook}
            />
          </TabsContent>

          <TabsContent
            value="credit-cards"
            className="flex h-full w-full flex-col overflow-hidden min-h-0"
          >
            <CreditCardPaymentsList
              payments={payments}
              currencySymbol={currencySymbol}
              refresh={refreshPayments}
            />
          </TabsContent>

          <TabsContent
            value="recurring"
            className="flex h-full w-full flex-col overflow-hidden min-h-0"
          >
            <RecurringBillsManageTable
              billsHook={billsHook}
              creditHook={creditHook}
              currencySymbol={currencySymbol}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TransactionPage;
