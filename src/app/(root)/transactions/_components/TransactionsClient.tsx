"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Clock3,
  CalendarDays,
  CreditCard,
  Repeat,
  Plus,
} from "lucide-react";

import { Transaction, UserSettings } from "@/types";
import { useTransaction } from "@/hooks/useTransactions";
import { useCreditCardPayments } from "@/hooks/useCreditCardPayments";
import UpcomingBills from "@/components/UpcomingBills";
import { useBills } from "@/hooks/useBills";
import type { RecurringBill } from "@/hooks/useBills";
import { RecurringBillsManageTable } from "@/components/RecurringBillsManageTable";
import { supabase } from "@/lib/supabaseClient";

import { CreditCardPaymentsList } from "@/components/CreditCardPaymentsList";
import { ImportTransactionsDialog } from "@/components/ImportTransactionsDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreditCardPayment } from "@/hooks/useCreditCardPayments";

type TransactionsClientProps = {
  initialTransactions: Transaction[];
  initialBills: RecurringBill[];
  initialCreditCardPayments: CreditCardPayment[];
  settings: UserSettings | null;
  userId: string;
};

export default function TransactionsClient({
  initialTransactions,
  initialBills,
  initialCreditCardPayments,
  settings,
  userId,
}: TransactionsClientProps) {
  const { transactions, loading, setTransactions } = useTransaction(initialTransactions);
  const isMobile = useIsMobile();
  const headerClass = isMobile
    ? "flex items-center justify-between pl-12"
    : "flex items-center justify-between";

  const billsHook = useBills(initialBills);
  const { bills, loading: billsLoading } = billsHook;
  const creditHook = useCreditCardPayments(initialCreditCardPayments);
  const { payments, refresh: refreshPayments } = creditHook;

  const [selectedRecurringBillId, setSelectedRecurringBillId] = useState<
    string | null
  >(null);

  const currencySymbol = settings?.currency_symbol || "$";

  const handleTransactionUpdated = useCallback(
    (updated: Transaction) => {
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === updated.id ? updated : transaction
        )
      );
    },
    [setTransactions]
  );

  const handleTransactionDeleted = useCallback(
    (deletedId: string) => {
      setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== deletedId)
      );
    },
    [setTransactions]
  );

  const handleAddTransaction = async (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const handleRecurringBillSelect = useCallback(
    (bill: RecurringBill | null) => {
      setSelectedRecurringBillId(bill?.id ?? null);
    },
    []
  );

  const recurringTransactions = useMemo(() => {
    if (transactions.length === 0) return [];

    const titleAmountKeys = new Set<string>();
    bills.forEach((bill) => {
      const normalizedTitle = bill.title?.trim().toLowerCase();
      if (!normalizedTitle) return;
      titleAmountKeys.add(
        `${normalizedTitle}|${Math.abs(bill.amount).toFixed(2)}`
      );
    });

    return transactions.filter((transaction) => {
      if (transaction.recurring_bill_id) {
        return true;
      }

      if (titleAmountKeys.size === 0) {
        return false;
      }

      const normalizedTitle = transaction.title?.trim().toLowerCase() || "";
      if (!normalizedTitle) {
        return false;
      }

      const key = `${normalizedTitle}|${Math.abs(transaction.amount).toFixed(
        2
      )}`;
      return titleAmountKeys.has(key);
    });
  }, [transactions, bills]);

  const selectedRecurringBill = useMemo(() => {
    if (!selectedRecurringBillId) return null;
    return bills.find((bill) => bill.id === selectedRecurringBillId) ?? null;
  }, [bills, selectedRecurringBillId]);

  useEffect(() => {
    if (!selectedRecurringBillId) return;
    const stillExists = bills.some(
      (bill) => bill.id === selectedRecurringBillId
    );
    if (!stillExists) {
      setSelectedRecurringBillId(null);
    }
  }, [bills, selectedRecurringBillId]);

  const filteredRecurringTransactions = useMemo(() => {
    if (!selectedRecurringBill) return recurringTransactions;

    const normalizedTitle =
      selectedRecurringBill.title?.trim().toLowerCase() ?? "";
    const normalizedAmount = Math.abs(selectedRecurringBill.amount).toFixed(2);

    return recurringTransactions.filter((transaction) => {
      if (transaction.recurring_bill_id === selectedRecurringBill.id) {
        return true;
      }

      if (!normalizedTitle) return false;

      const transactionTitle = transaction.title?.trim().toLowerCase() ?? "";
      if (!transactionTitle) return false;

      const transactionAmount = Math.abs(transaction.amount).toFixed(2);
      return (
        transactionAmount === normalizedAmount &&
        transactionTitle === normalizedTitle
      );
    });
  }, [recurringTransactions, selectedRecurringBill]);

  const recurringLoading = loading || billsLoading;

  return (
    <div className="flex h-[95vh] w-full flex-col gap-4 overflow-hidden max-[1320px]:h-auto max-[1320px]:min-h-screen max-[1320px]:overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-shrink-0 flex-col gap-3">
        <div className={headerClass}>
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
            <div className="hidden sm:block">
              <AddTransactionDialog onAddTransaction={handleAddTransaction} />
            </div>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="recent"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden max-[1320px]:min-h-fit max-[1320px]:overflow-visible"
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

        <div className="w-full flex-1 overflow-hidden px-1 py-2 sm:px-0 sm:py-3 min-h-0 max-[1320px]:flex-none max-[1320px]:min-h-fit max-[1320px]:overflow-visible">
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
                  onTransactionUpdated={handleTransactionUpdated}
                  onTransactionDeleted={handleTransactionDeleted}
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
            className="flex h-full w-full flex-col overflow-hidden min-h-0 max-[1320px]:h-auto max-[1320px]:min-h-fit max-[1320px]:overflow-visible"
          >
            <div className="grid h-full w-full min-h-0 gap-3 grid-cols-1 min-[1320px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] max-[1320px]:h-auto max-[1320px]:min-h-fit">
              <div className="flex min-h-0 flex-col">
                <RecurringBillsManageTable
                  billsHook={billsHook}
                  creditHook={creditHook}
                  currencySymbol={currencySymbol}
                  selectedBillId={selectedRecurringBillId}
                  onSelectRecurringBill={handleRecurringBillSelect}
                />
              </div>
              <div className="flex min-h-0 flex-col">
                {recurringLoading ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/20">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"></div>
                      <p className="text-sm">
                        Loading recurring transactions...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-1 min-h-0">
                    <div className="flex w-full flex-1 flex-col">
                      <TransactionList
                        transactions={filteredRecurringTransactions}
                        currencySymbol={currencySymbol}
                        onTransactionUpdated={handleTransactionUpdated}
                        onTransactionDeleted={handleTransactionDeleted}
                        title={
                          selectedRecurringBill
                            ? `Recurring Bill Transactions — ${selectedRecurringBill.title}`
                            : "Recurring Bill Transactions"
                        }
                        subtitle={
                          filteredRecurringTransactions.length === 0
                            ? "No recurring bill payments recorded yet"
                            : undefined
                        }
                        note={
                          selectedRecurringBill
                            ? "Filtering by the selected recurring bill. Clear the filter to view all linked payments."
                            : "Shows payments linked to recurring bills (directly or by matching bill name and amount)."
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Mobile Add button */}
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
  );
}
