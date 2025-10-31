"use client";

import { useEffect, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
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

type ResizableColumnKey =
  | "title"
  | "account"
  | "category"
  | "date"
  | "amount"
  | "action";

const initialColumnWidths: Record<ResizableColumnKey, number> = {
  title: 240,
  account: 200,
  category: 200,
  date: 140,
  amount: 140,
  action: 90,
};

const minColumnWidths: Record<ResizableColumnKey, number> = {
  title: 160,
  account: 140,
  category: 140,
  date: 120,
  amount: 120,
  action: 90,
};

interface TransactionListProps {
  transactions: Transaction[];
  currencySymbol?: string;
  onTransactionUpdated?: (updated: Transaction) => void;
  onTransactionDeleted?: (id: string) => void;
}

export function TransactionList({
  transactions,
  currencySymbol,
  onTransactionUpdated,
  onTransactionDeleted,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");

  const { getAccountById, accounts } = useAccounts();
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // ソート状態
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [columnWidths, setColumnWidths] = useState<
    Record<ResizableColumnKey, number>
  >(() => ({ ...initialColumnWidths }));
  const [resizingColumn, setResizingColumn] =
    useState<ResizableColumnKey | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; width: number }>({
    x: 0,
    width: 0,
  });

  const getColumnStyle = (column: ResizableColumnKey) => ({
    minWidth: columnWidths[column],
    width: columnWidths[column],
  });

  const handleResizeStart = (
    event:
      | ReactMouseEvent<HTMLSpanElement>
      | ReactTouchEvent<HTMLSpanElement>,
    column: ResizableColumnKey
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const clientX =
      "touches" in event ? event.touches[0]?.clientX ?? 0 : event.clientX;

    setResizingColumn(column);
    setDragStart({
      x: clientX,
      width: columnWidths[column],
    });
  };

  const renderResizeHandle = (column: ResizableColumnKey) => {
    const isActive = resizingColumn === column;
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        onMouseDown={(event) => handleResizeStart(event, column)}
        onTouchStart={(event) => handleResizeStart(event, column)}
        className="group absolute right-0 top-0 z-10 flex h-full w-3 cursor-col-resize select-none items-center justify-center touch-none"
      >
        <span
          aria-hidden
          className={`h-full w-px rounded transition-colors ${
            isActive ? "bg-primary" : "group-hover:bg-foreground/60 bg-border"
          }`}
        />
      </span>
    );
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const column = resizingColumn;

    const updateWidth = (clientX: number) => {
      const delta = clientX - dragStart.x;
      const nextWidth = Math.max(
        minColumnWidths[column],
        dragStart.width + delta
      );

      setColumnWidths((prev) => {
        if (prev[column] === nextWidth) return prev;
        return {
          ...prev,
          [column]: nextWidth,
        };
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      updateWidth(event.clientX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      const touch = event.touches[0];
      event.preventDefault();
      updateWidth(touch.clientX);
    };

    const stopResizing = () => {
      setResizingColumn(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", stopResizing);
    window.addEventListener("touchcancel", stopResizing);

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopResizing);
      window.removeEventListener("touchcancel", stopResizing);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [dragStart, resizingColumn]);

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
    <Card className="flex h-full min-h-0 w-full flex-1 max-w-none flex-col overflow-hidden bg-card border-border">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Recent Transactions
          </h2>
          <span className="text-sm text-muted-foreground">
            {sortedTransactions.length} transactions
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
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
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        {sortedTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              No transactions found
            </div>
          </div>
        ) : (
          <div className="h-full overflow-x-auto overflow-y-auto">
            <Table className="table-fixed">
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead
                    className="relative"
                    style={getColumnStyle("title")}
                  >
                    <div className="pr-3">Title</div>
                    {renderResizeHandle("title")}
                  </TableHead>
                  <TableHead
                    className="relative"
                    style={getColumnStyle("account")}
                  >
                    <div className="pr-3">Account</div>
                    {renderResizeHandle("account")}
                  </TableHead>
                  <TableHead
                    className="relative"
                    style={getColumnStyle("category")}
                  >
                    <div className="pr-3">Category</div>
                    {renderResizeHandle("category")}
                  </TableHead>

                  {/* Date Column with sort */}
                  <TableHead
                    className="relative"
                    style={getColumnStyle("date")}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="flex w-full items-center gap-1 bg-transparent p-0 pr-3 text-left font-medium text-foreground outline-none transition-colors hover:text-foreground focus-visible:outline-none"
                  >
                      Date
                      {sortOrder === "asc" ? (
                        <ArrowUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {renderResizeHandle("date")}
                  </TableHead>

                  <TableHead
                    className="relative text-center"
                    style={getColumnStyle("amount")}
                  >
                    <div className="flex w-full justify-center pr-3">Amount</div>
                    {renderResizeHandle("amount")}
                  </TableHead>
                  <TableHead
                    className="relative text-center"
                    style={getColumnStyle("action")}
                  >
                    <div className="flex w-full justify-center pr-3">Action</div>
                    {renderResizeHandle("action")}
                  </TableHead>
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
                      <TableCell
                        className="font-medium text-foreground truncate"
                        style={getColumnStyle("title")}
                        title={transaction.title}
                      >
                        {transaction.title}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground truncate"
                        style={getColumnStyle("account")}
                        title={account?.name || "-"}
                      >
                        {account?.name || "-"}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground truncate"
                        style={getColumnStyle("category")}
                        title={categoryName}
                      >
                        {categoryName}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        style={getColumnStyle("date")}
                      >
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell
                        className={`text-center font-semibold ${
                          isPositive ? "text-success" : "text-foreground"
                        }`}
                        style={getColumnStyle("amount")}
                      >
                        {isPositive ? "+" : "-"}
                        {currencySymbol}
                        {Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell
                        className="text-center"
                        style={getColumnStyle("action")}
                      >
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
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {selectedTransaction && (
        <EditTransactionDialog
          transaction={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={(open) => {
            if (!open) setSelectedTransaction(null);
          }}
          onTransactionUpdated={onTransactionUpdated}
          onTransactionDeleted={onTransactionDeleted}
        />
      )}
    </Card>
  );
}
