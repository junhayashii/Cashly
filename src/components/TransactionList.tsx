"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Home,
  Utensils,
  Car,
  Pencil,
  ArrowUp,
  ArrowDown,
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

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");

  const { getAccountById, accounts } = useAccounts();
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // ソート状態
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const categories = [
    ...new Set(
      transactions
        .map((t) => t.category?.name)
        .filter((name): name is string => Boolean(name))
    ),
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const categoryName = transaction.category?.name || "Other";
    const accountName = getAccountById(transaction.account_id)?.name || "";

    const matchesSearch =
      transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory =
      filterCategory === "all" || categoryName === filterCategory;
    const matchesAccount =
      filterAccount === "all" || accountName === filterAccount;

    return matchesSearch && matchesType && matchesCategory && matchesAccount;
  });

  // ソート処理
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.date || "").getTime();
    const dateB = new Date(b.date || "").getTime();

    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // 日付フォーマット関数
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Recent Transactions
        </h2>
        <span className="text-sm text-muted-foreground">
          {sortedTransactions.length} transactions
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-background border-border"
        />

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterAccount} onValueChange={setFilterAccount}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.name}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {sortedTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No transactions found
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Category</TableHead>

              {/* Date Column with sort */}
              <TableHead
                className="cursor-pointer select-none"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                <div className="flex items-center gap-1">
                  Date
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </TableHead>

              <TableHead className="text-center">Amount</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedTransactions.map((transaction) => {
              const categoryName = transaction.category?.name || "Other";
              const Icon = categoryIcons[categoryName] || ShoppingBag;
              const isPositive = transaction.type === "income";
              const account = getAccountById(transaction.account_id);

              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div
                      className={`p-2 rounded-lg ${
                        isPositive ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {transaction.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account?.name || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {categoryName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell
                    className={`text-center font-semibold ${
                      isPositive ? "text-success" : "text-foreground"
                    }`}
                  >
                    {isPositive ? "+" : "-"}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Edit Dialog */}
      {selectedTransaction && (
        <EditTransactionDialog
          transaction={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={(open) => {
            if (!open) setSelectedTransaction(null);
          }}
          onTransactionUpdated={(updatedTransaction) => {
            // handle update logic
          }}
        />
      )}
    </Card>
  );
}
