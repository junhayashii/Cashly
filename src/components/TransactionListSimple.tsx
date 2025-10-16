"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Home,
  Utensils,
  Car,
  ArrowDownRight,
  Pencil,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { Transaction } from "@/types";
import { useAccounts } from "@/hooks/useAccounts";
import { EditTransactionDialog } from "@/components/EditTransactionsDialog";

const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Income: ArrowDownRight,
  Salary: ArrowDownRight,
  Freelance: ArrowDownRight,
  Food: ShoppingBag,
  Shopping: ShoppingBag,
  Housing: Home,
  Dining: Utensils,
  Transport: Car,
  Entertainment: ShoppingBag,
  Healthcare: ShoppingBag,
  Utilities: Home,
  Other: ShoppingBag,
};

interface TransactionListSimpleProps {
  transactions: Transaction[];
  currencySymbol?: string;
}

export function TransactionListSimple({
  transactions,
  currencySymbol,
}: TransactionListSimpleProps) {
  const { getAccountById } = useAccounts();
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || "").getTime();
    const dateB = new Date(b.date || "").getTime();
    return dateB - dateA;
  });

  const topThree = sortedTransactions.slice(0, 3);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="p-6 bg-card border-border h-80 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Recent Transactions
          </h2>
          <span className="text-sm text-muted-foreground">Last 3</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <Link href="/transactions">
            <span className="text-xs">See All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {topThree.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No transactions found
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {topThree.map((transaction) => {
            const categoryName = transaction.category?.name || "Other";
            const Icon = categoryIcons[categoryName] || ShoppingBag;
            const isPositive = transaction.type === "income";
            const account = getAccountById(transaction.account_id);

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 px-1 hover:bg-muted/30 transition-colors rounded"
              >
                {/* 左：アイコン */}
                <div className="flex-shrink-0 mr-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* 中央：タイトル・日付・アカウント */}
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="font-medium text-foreground truncate text-sm">
                    {transaction.title}
                  </span>
                  <div className="flex text-xs text-muted-foreground gap-2">
                    <span>{account?.name || "-"}</span>
                    <span>•</span>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>

                {/* 右：金額 + 編集 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-sm ${
                      isPositive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isPositive ? "+" : "-"}
                    {currencySymbol}
                    {Math.abs(transaction.amount).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTransaction && (
        <EditTransactionDialog
          transaction={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={(open) => {
            if (!open) setSelectedTransaction(null);
          }}
          onTransactionUpdated={(updatedTransaction) => {
            // update logic here
          }}
        />
      )}
    </Card>
  );
}
