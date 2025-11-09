"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ShoppingBag, ArrowUp, ArrowDown, Download, X } from "lucide-react";

import { Transaction } from "@/types";
import { useAccounts } from "@/hooks/useAccounts";
import { EditTransactionDialog } from "@/components/EditTransactionsDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportTransactionsCSV } from "@/components/exportTransactionsCSV";

const transactionTypeMeta: Record<
  Transaction["type"],
  {
    label: string;
    className: string;
  }
> = {
  income: {
    label: "Income",
    className:
      "bg-emerald-100/70 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  expense: {
    label: "Expense",
    className:
      "bg-rose-100/70 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
  },
  savings: {
    label: "Savings",
    className:
      "bg-sky-100/70 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
  },
  transfer: {
    label: "Transfer",
    className:
      "bg-amber-100/70 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  },
};

const PAGE_SIZE = 30;

interface TransactionListProps {
  transactions: Transaction[];
  currencySymbol?: string;
  onTransactionUpdated?: (updated: Transaction) => void;
  onTransactionDeleted?: (id: string) => void;
  title?: string;
  subtitle?: string;
  note?: string;
}

export function TransactionList({
  transactions,
  currencySymbol,
  onTransactionUpdated,
  onTransactionDeleted,
  title,
  subtitle,
  note,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const { getAccountById, accounts } = useAccounts();
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // ソート状態
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const categories = [
    ...new Set(
      transactions
        .map((t) => t.category?.name)
        .filter((name): name is string => Boolean(name))
    ),
  ];
  const paymentMethods = [
    ...new Set(
      transactions
        .map((t) => t.payment_method)
        .filter((method): method is string => Boolean(method))
    ),
  ];
  const startDateFilter = filterStartDate ? new Date(filterStartDate) : null;
  const endDateFilter = filterEndDate ? new Date(filterEndDate) : null;

  const filteredTransactions = transactions.filter((transaction) => {
    const categoryName = transaction.category?.name || "Other";
    const accountName = getAccountById(transaction.account_id)?.name || "";
    const paymentMethod = transaction.payment_method || "";
    const transactionDate = transaction.date
      ? new Date(transaction.date)
      : null;

    const matchesSearch =
      (transaction.title ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (transaction.type ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory =
      filterCategory === "all" || categoryName === filterCategory;
    const matchesAccount =
      filterAccount === "all" || accountName === filterAccount;
    const matchesPaymentMethod =
      filterPaymentMethod === "all" || paymentMethod === filterPaymentMethod;
    const matchesStartDate =
      !startDateFilter ||
      (transactionDate !== null && transactionDate >= startDateFilter);
    const matchesEndDate =
      !endDateFilter ||
      (transactionDate !== null && transactionDate <= endDateFilter);

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesAccount &&
      matchesPaymentMethod &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  // ソート処理
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.date || "").getTime();
    const dateB = new Date(b.date || "").getTime();

    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const totalTransactions = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const rangeStart =
    totalTransactions === 0 ? 0 : (currentPageSafe - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPageSafe * PAGE_SIZE, totalTransactions);
  const defaultSubtitle = `${rangeStart} - ${rangeEnd} of ${totalTransactions} transactions`;

  const paginatedTransactions = sortedTransactions.slice(
    (currentPageSafe - 1) * PAGE_SIZE,
    currentPageSafe * PAGE_SIZE
  );

  // Row selection logic
  const isAllSelectedOnPage =
    paginatedTransactions.length > 0 &&
    paginatedTransactions.every((t) => selectedRows.has(t.id));
  const isSomeSelectedOnPage = paginatedTransactions.some((t) =>
    selectedRows.has(t.id)
  );
  const isAllSelectedAcrossAllPages =
    sortedTransactions.length > 0 &&
    sortedTransactions.every((t) => selectedRows.has(t.id));

  const toggleRowSelection = (transactionId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    if (isAllSelectedOnPage) {
      // Deselect all on current page
      setSelectedRows((prev) => {
        const next = new Set(prev);
        paginatedTransactions.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      // Select all on current page
      setSelectedRows((prev) => {
        const next = new Set(prev);
        paginatedTransactions.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  // Select all transactions across all pages
  const selectAllAcrossAllPages = () => {
    setSelectedRows(new Set(sortedTransactions.map((t) => t.id)));
  };

  // Get selected transactions for export
  const selectedTransactions = useMemo(() => {
    return transactions.filter((t) => selectedRows.has(t.id));
  }, [transactions, selectedRows]);

  // Export selected transactions
  const handleExportSelected = () => {
    if (selectedTransactions.length === 0) return;

    // Format transactions for CSV export
    const formattedTransactions = selectedTransactions.map((t) => ({
      ...t,
      category_name: t.category?.name || "Other",
    }));

    exportTransactionsCSV(
      formattedTransactions,
      `selected-transactions-${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filterType,
    filterCategory,
    filterAccount,
    filterPaymentMethod,
    filterStartDate,
    filterEndDate,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationItems = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const shouldShowLeftEllipsis = currentPageSafe > 3;
    const shouldShowRightEllipsis = currentPageSafe < totalPages - 2;
    pages.push(1);

    if (shouldShowLeftEllipsis) {
      pages.push("...");
    }

    const start = Math.max(2, currentPageSafe - 1);
    const end = Math.min(totalPages - 1, currentPageSafe + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (shouldShowRightEllipsis) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }, [currentPageSafe, totalPages]);

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
    <Card className="flex h-full max-h-screen min-h-0 w-full flex-1 max-w-none flex-col overflow-hidden rounded-xl border border-border/40 bg-background/60 shadow-sm backdrop-blur-sm">
      {/* Fixed Header */}
      <div className="bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col gap-4 px-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {title ?? "Recent Transactions"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {subtitle ?? defaultSubtitle}
              </p>
              {note ? (
                <p className="mt-1 text-xs text-muted-foreground/80">{note}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {selectedRows.size > 0 ? (
                <>
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                    <span className="font-medium">{selectedRows.size}</span>
                    <span className="text-xs">
                      {selectedRows.size === 1 ? "selected" : "selected"}
                    </span>
                    {!isAllSelectedAcrossAllPages && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        of {totalTransactions}
                      </span>
                    )}
                  </Badge>
                  {!isAllSelectedAcrossAllPages && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllAcrossAllPages}
                      className="gap-2"
                    >
                      Select All {totalTransactions}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSelected}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-border/40 bg-background/80 backdrop-blur-sm"
            />

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="border-border/40 bg-background/80 backdrop-blur-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterPaymentMethod}
              onValueChange={setFilterPaymentMethod}
            >
              <SelectTrigger className="border-border/40 bg-background/80 backdrop-blur-sm">
                <SelectValue placeholder="All Payment Methods" />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="all">All Payment Methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="border-border/40 bg-background/80 backdrop-blur-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="border-border/40 bg-background/80 backdrop-blur-sm">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.name}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Input
                type="date"
                aria-label="Start date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border-border/40 bg-background/80 backdrop-blur-sm md:w-40"
              />
              <Input
                type="date"
                aria-label="End date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border-border/40 bg-background/80 backdrop-blur-sm md:w-40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 min-h-0 px-4">
        {paginatedTransactions.length === 0 ? (
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/20">
            <div className="text-center space-y-3 px-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  No transactions found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters or add a new transaction
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-x-auto overflow-y-auto rounded-lg border border-border/30 bg-background/50 backdrop-blur-sm">
            <Table className="table-fixed w-full">
              <TableHeader className="sticky top-0 z-20 border-b border-border/50 bg-muted/80 backdrop-blur-md shadow-sm">
                <TableRow className="hover:bg-transparent bg-muted/80">
                  <TableHead className="w-[48px] pl-4">
                    <Checkbox
                      checked={
                        isAllSelectedOnPage
                          ? true
                          : isSomeSelectedOnPage
                          ? "indeterminate"
                          : false
                      }
                      onCheckedChange={toggleSelectAllOnPage}
                      aria-label="Select all on page"
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
                    />
                  </TableHead>
                  <TableHead className="h-11 text-muted-foreground w-[calc((100%-48px)/6)]">
                    <div className="pr-3 text-xs font-medium uppercase tracking-wider">
                      Transaction
                    </div>
                  </TableHead>
                  <TableHead className="h-11 text-muted-foreground w-[calc((100%-48px)/6)]">
                    <div className="pr-3 text-xs font-medium uppercase tracking-wider">
                      Account
                    </div>
                  </TableHead>
                  <TableHead className="h-11 text-muted-foreground w-[calc((100%-48px)/6)]">
                    <div className="pr-3 text-xs font-medium uppercase tracking-wider">
                      Payment
                    </div>
                  </TableHead>
                  <TableHead className="h-11 text-muted-foreground w-[calc((100%-48px)/6)]">
                    <div className="pr-3 text-xs font-medium uppercase tracking-wider">
                      Category
                    </div>
                  </TableHead>

                  {/* Date Column with sort */}
                  <TableHead className="h-11 text-muted-foreground w-[calc((100%-48px)/6)]">
                    <button
                      type="button"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="flex w-full items-center gap-1.5 bg-transparent p-0 pr-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground outline-none transition-all hover:text-foreground focus-visible:outline-none"
                    >
                      Date
                      <div className="flex flex-col">
                        <ArrowUp
                          className={`h-3 w-3 transition-opacity ${
                            sortOrder === "asc"
                              ? "opacity-100 text-primary"
                              : "opacity-30"
                          }`}
                        />
                        <ArrowDown
                          className={`h-3 w-3 -mt-1.5 transition-opacity ${
                            sortOrder === "desc"
                              ? "opacity-100 text-primary"
                              : "opacity-30"
                          }`}
                        />
                      </div>
                    </button>
                  </TableHead>

                  <TableHead className="h-11 text-center text-muted-foreground w-[calc((100%-48px)/6)]">
                    <div className="flex w-full justify-center pr-3 text-xs font-medium uppercase tracking-wider">
                      Amount
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedTransactions.map((transaction, index) => {
                  const categoryName = transaction.category?.name || "Other";
                  const isPositive = transaction.type === "income";
                  const account = getAccountById(transaction.account_id);
                  const paymentMethod = transaction.payment_method || null;
                  const typeMeta =
                    transactionTypeMeta[transaction.type] ??
                    transactionTypeMeta.expense;
                  const handleRowActivation = () => {
                    setSelectedTransaction(transaction);
                  };
                  const handleRowKeyDown = (
                    event: ReactKeyboardEvent<HTMLTableRowElement>
                  ) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowActivation();
                    }
                  };

                  const isSelected = selectedRows.has(transaction.id);

                  return (
                    <TableRow
                      key={transaction.id}
                      tabIndex={0}
                      onClick={handleRowActivation}
                      onKeyDown={handleRowKeyDown}
                      data-state={isSelected ? "selected" : undefined}
                      className={`group cursor-pointer border-b border-border/15 bg-background/30 transition-all duration-150 hover:bg-primary/5 hover:border-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=selected]:bg-primary/5 data-[state=selected]:border-primary/15 ${
                        index % 2 === 0
                          ? "bg-background/40"
                          : "bg-background/30"
                      }`}
                    >
                      <TableCell
                        className="pl-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleRowSelection(transaction.id)
                          }
                          aria-label={`Select ${transaction.title}`}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </TableCell>
                      <TableCell className="py-3 w-[calc((100%-48px)/6)]">
                        <div className="flex flex-col gap-1.5 pr-3 min-w-0">
                          <span
                            className="font-medium text-sm text-foreground truncate block overflow-hidden text-ellipsis whitespace-nowrap"
                            title={transaction.title}
                          >
                            {transaction.title}
                          </span>
                          <span
                            className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${typeMeta.className}`}
                          >
                            {typeMeta.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="py-3 text-sm text-muted-foreground w-[calc((100%-48px)/6)]"
                        title={account?.name || "-"}
                      >
                        <div className="pr-3 min-w-0">
                          <span className="truncate block overflow-hidden text-ellipsis whitespace-nowrap">
                            {account?.name || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="py-3 text-sm text-muted-foreground w-[calc((100%-48px)/6)]"
                        title={paymentMethod || "-"}
                      >
                        <div className="pr-3 min-w-0">
                          <span className="truncate block overflow-hidden text-ellipsis whitespace-nowrap">
                            {paymentMethod || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="py-3 text-sm w-[calc((100%-48px)/6)]"
                        title={categoryName}
                      >
                        <div className="pr-3 min-w-0">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground/70 truncate">
                            {categoryName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-sm font-medium text-muted-foreground w-[calc((100%-48px)/6)]">
                        <div className="pr-3">
                          {formatDate(transaction.date)}
                        </div>
                      </TableCell>
                      <TableCell
                        className={`py-3 text-center w-[calc((100%-48px)/6)] ${
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-center pr-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-semibold ${
                              isPositive
                                ? "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-rose-50/80 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                            }`}
                          >
                            {isPositive ? "+" : "-"}
                            {currencySymbol}
                            {Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalTransactions > 0 && (
        <div className="bg-background/50 px-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Page {currentPageSafe} of {totalPages}
            </span>
            <Pagination className="w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPageSafe === 1) return;
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                    }}
                    className="disabled:pointer-events-none disabled:opacity-50"
                    aria-disabled={currentPageSafe === 1}
                  />
                </PaginationItem>
                {paginationItems.map((item, index) => (
                  <PaginationItem key={`${item}-${index}`}>
                    {item === "..." ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={currentPageSafe === item}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPageSafe === totalPages) return;
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    }}
                    className="disabled:pointer-events-none disabled:opacity-50"
                    aria-disabled={currentPageSafe === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

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
