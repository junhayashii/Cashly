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
} from "lucide-react";

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
}

export function TransactionListSimple({
  transactions,
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
    <Card className="p-6 bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">
          Recent Transactions
        </h2>
        <span className="text-sm text-muted-foreground">Last 3</span>
      </div>

      {topThree.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No transactions found
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topThree.map((transaction) => {
            const categoryName = transaction.category?.name || "Other";
            const Icon = categoryIcons[categoryName] || ShoppingBag;
            const isPositive = transaction.type === "income";
            const account = getAccountById(transaction.account_id);

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-all p-3"
              >
                {/* 左：アイコン */}
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    isPositive ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* 中央：タイトル・日付・アカウント */}
                <div className="flex flex-col flex-1 mx-4 overflow-hidden">
                  <span className="font-medium text-foreground truncate">
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
                    className={`font-semibold ${
                      isPositive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isPositive ? "+" : "-"}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
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
