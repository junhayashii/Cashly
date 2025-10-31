"use client";

import { useState, useEffect } from "react";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

import { Transaction } from "@/types";
import { useTransaction } from "@/hooks/useTransactions";
import { useCreditCardPayments } from "@/hooks/useCreditCardPayments";
import RecurringBills from "@/components/RecurringBills";
import { supabase } from "@/lib/supabaseClient";
import { useUserSettings } from "@/hooks/useUserSettings";

import { exportTransactionsCSV } from "@/components/exportTransactionsCSV";
import { CreditCardPaymentsList } from "@/components/CreditCardPaymentsList";
import { ImportTransactionsDialog } from "@/components/ImportTransactionsDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TransactionPage = () => {
  const { transactions, loading, setTransactions } = useTransaction();

  const { payments, refresh: refreshPayments } = useCreditCardPayments();

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
    <div className="flex h-[100dvh] w-full flex-col gap-8 overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-foreground">
            Transactions
          </h2>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              exportTransactionsCSV(transactions, `transactions.csv`)
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <ImportTransactionsDialog />
          <AddTransactionDialog onAddTransaction={handleAddTransaction} />
        </div>
      </div>

      <Tabs
        defaultValue="recent"
        className="flex flex-1 min-h-0 flex-col overflow-hidden"
      >
        <TabsList className="w-full flex-shrink-0 justify-start overflow-x-auto">
          <TabsTrigger value="recent" className="flex-1 sm:flex-initial">
            Recent
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-initial">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="credit-cards" className="flex-1 sm:flex-initial">
            Credit Cards
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 w-full flex-1 overflow-hidden min-h-0">
          <TabsContent
            value="recent"
            className="flex h-full w-full flex-col overflow-hidden min-h-0"
          >
            {loading ? (
              <div className="flex w-full items-center justify-center py-12">
                <div>Loading transactions...</div>
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
            className="h-full w-full overflow-auto"
          >
            <RecurringBills currencySymbol={currencySymbol} />
          </TabsContent>

          <TabsContent
            value="credit-cards"
            className="h-full w-full overflow-auto"
          >
            <CreditCardPaymentsList
              payments={payments}
              currencySymbol={currencySymbol}
              refresh={refreshPayments}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TransactionPage;
