"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CreditCardPayment {
  id: string;
  title: string;
  amount: number;
  installment_number: number;
  total_installments: number;
  due_date: string;
  paid: boolean;
  paid_date?: string;
}

interface CreditCardPaymentsListProps {
  payments: CreditCardPayment[];
  currencySymbol?: string;
  refresh?: () => void; // useCreditCardPaymentsのrefreshを受け取る
}

export function CreditCardPaymentsList({
  payments,
  currencySymbol = "¥",
  refresh,
}: CreditCardPaymentsListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setSelectedRows((previous) => {
      const next = new Set<string>();
      payments.forEach((payment) => {
        if (previous.has(payment.id)) {
          next.add(payment.id);
        }
      });
      return next;
    });
  }, [payments]);

  const handleMarkAsPaid = async (paymentId: string) => {
    setUpdatingId(paymentId);
    const { error } = await supabase
      .from("credit_card_payments")
      .update({
        paid: true,
        paid_date: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      console.error("Error marking as paid:", error);
    } else {
      // Triggerが動いてtransactionsに自動追加される
      console.log("✅ Marked as paid:", paymentId);
      if (refresh) refresh(); // リスト更新
    }
    setUpdatingId(null);
  };

  const handleBulkMarkAsPaid = async () => {
    const unpaidSelected = payments.filter(
      (payment) => selectedRows.has(payment.id) && !payment.paid
    );
    if (unpaidSelected.length === 0) return;

    setBulkUpdating(true);
    const idsToUpdate = unpaidSelected.map((payment) => payment.id);

    const { error } = await supabase
      .from("credit_card_payments")
      .update({
        paid: true,
        paid_date: new Date().toISOString(),
      })
      .in("id", idsToUpdate);

    if (error) {
      console.error("Error marking selected payments as paid:", error);
    } else if (refresh) {
      refresh();
    }
    setBulkUpdating(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleRowSelection = (paymentId: string) => {
    setSelectedRows((previous) => {
      const next = new Set(previous);

      if (next.has(paymentId)) {
        next.delete(paymentId);
      } else {
        next.add(paymentId);
      }
      return next;
    });
  };

  const totalPayments = payments.length;
  const totalPages = Math.max(1, Math.ceil(totalPayments / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedPayments = useMemo(
    () =>
      payments.slice(
        (currentPageSafe - 1) * PAGE_SIZE,
        currentPageSafe * PAGE_SIZE
      ),
    [payments, currentPageSafe]
  );
  const hasPayments = totalPayments > 0;
  const rangeStart = hasPayments ? (currentPageSafe - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = hasPayments
    ? Math.min(currentPageSafe * PAGE_SIZE, totalPayments)
    : 0;

  const isAllSelectedOnPage =
    paginatedPayments.length > 0 &&
    paginatedPayments.every((payment) => selectedRows.has(payment.id));
  const isSomeSelectedOnPage = paginatedPayments.some((payment) =>
    selectedRows.has(payment.id)
  );
  const isAllSelectedAcrossAllPages =
    payments.length > 0 &&
    payments.every((payment) => selectedRows.has(payment.id));

  const toggleSelectAllOnPage = () => {
    setSelectedRows((previous) => {
      const next = new Set(previous);
      const pageSelected = paginatedPayments.every((payment) =>
        previous.has(payment.id)
      );

      if (pageSelected) {
        paginatedPayments.forEach((payment) => next.delete(payment.id));
      } else {
        paginatedPayments.forEach((payment) => next.add(payment.id));
      }

      return next;
    });
  };

  const clearSelection = () => setSelectedRows(new Set());

  const selectedPayments = useMemo(
    () => payments.filter((payment) => selectedRows.has(payment.id)),
    [payments, selectedRows]
  );

  const unpaidSelectedCount = selectedPayments.filter(
    (payment) => !payment.paid
  ).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [totalPayments]);

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

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background/60 shadow-sm backdrop-blur-sm">
      <div className="bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">
                Credit Card Payments
              </h2>
              <p className="text-sm text-muted-foreground">
                {hasPayments ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {rangeStart}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-foreground">
                      {rangeEnd}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">
                      {totalPayments}
                    </span>{" "}
                    {totalPayments === 1 ? "payment" : "payments"}
                  </>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-foreground">0</span>{" "}
                    payments
                  </>
                )}
              </p>
            </div>
            {selectedRows.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs font-medium text-muted-foreground">
                  <span className="text-sm font-semibold text-foreground">
                    {selectedRows.size}
                  </span>{" "}
                  selected
                  {!isAllSelectedAcrossAllPages && hasPayments && (
                    <> of {totalPayments}</>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsPaid}
                  disabled={unpaidSelectedCount === 0 || bulkUpdating}
                  className="gap-2"
                >
                  {bulkUpdating ? "Updating..." : "Mark Selected Paid"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4">
        {payments.length === 0 ? (
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/30 backdrop-blur-sm">
            <div className="text-center space-y-4 px-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center ring-4 ring-background">
                <CheckCircle2 className="h-7 w-7 text-muted-foreground/70" />
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-lg text-foreground">
                  No credit card payments found
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Credit card payments will appear here when available
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1 min-h-0">
              {/* Mobile layout */}
              <div className="md:hidden flex h-full max-h-[70vh] flex-col gap-3 overflow-y-auto pb-4 pr-1">
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        isAllSelectedOnPage
                          ? true
                          : isSomeSelectedOnPage
                          ? "indeterminate"
                          : false
                      }
                      onCheckedChange={toggleSelectAllOnPage}
                      aria-label="Select visible payments"
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      このページを全選択/解除
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {rangeStart}-{rangeEnd} / {totalPayments}
                  </span>
                </div>

                {paginatedPayments.map((p) => {
                  const isSelected = selectedRows.has(p.id);

                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border bg-background/70 p-4 shadow-sm backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRowSelection(p.id)}
                            aria-label={`Select ${p.title} payment`}
                            className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground leading-tight">
                                {p.title} ({p.installment_number}/
                                {p.total_installments})
                              </p>
                              {p.paid ? (
                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/80 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Paid
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-50/80 text-yellow-700 px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-inset ring-yellow-200/60 dark:bg-yellow-950/40 dark:text-yellow-400 dark:ring-yellow-500/30">
                                  <Clock className="h-3.5 w-3.5" />
                                  Pending
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Due {formatDate(p.due_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right shrink-0">
                          {!p.paid && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === p.id}
                              onClick={() => handleMarkAsPaid(p.id)}
                              className="w-28 gap-2 border-border/60 hover:bg-accent/50"
                            >
                              {updatingId === p.id ? "Updating..." : "Pay"}
                            </Button>
                          )}
                          <span className="text-base font-semibold text-foreground">
                            {currencySymbol}
                            {p.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop layout */}
              <div className="hidden md:block h-full max-h-[70vh] overflow-x-auto overflow-y-auto rounded-xl border border-border bg-background/60 backdrop-blur-sm shadow-sm">
                <Table className="table-fixed w-full">
                  <TableHeader className="sticky top-0 z-20 border-b border-border/50 bg-muted/80 backdrop-blur-md shadow-sm">
                    <TableRow className="hover:bg-transparent bg-muted/80 border-border">
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
                          aria-label="Select all payments"
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
                        />
                      </TableHead>
                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-48px)/5)]">
                        Title
                      </TableHead>
                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-48px)/5)]">
                        Due Date
                      </TableHead>
                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-48px)/5)]">
                        Status
                      </TableHead>
                      <TableHead className="h-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-48px)/5)]">
                        Amount
                      </TableHead>
                      <TableHead className="h-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-48px)/5)]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((p, index) => {
                      const isSelected = selectedRows.has(p.id);

                      return (
                        <TableRow
                          key={p.id}
                          data-state={isSelected ? "selected" : undefined}
                          className={`border-b border-border/25 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 ${
                            index % 2 === 0
                              ? "bg-background/50"
                              : "bg-background/40"
                          } hover:bg-primary/8 hover:border-primary/15 hover:shadow-sm`}
                        >
                          <TableCell
                            className="pl-4 pr-2 py-4 w-[48px]"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRowSelection(p.id)}
                              aria-label={`Select ${p.title} payment`}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </TableCell>
                          <TableCell className="py-4 text-sm font-medium text-foreground w-[calc((100%-48px)/5)]">
                            {p.title} ({p.installment_number}/
                            {p.total_installments})
                          </TableCell>
                          <TableCell className="py-4 text-sm text-muted-foreground w-[calc((100%-48px)/5)]">
                            {formatDate(p.due_date)}
                          </TableCell>
                          <TableCell className="py-4 w-[calc((100%-48px)/5)]">
                            {p.paid ? (
                              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/80 text-emerald-700 px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Paid
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-50/80 text-yellow-700 px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-inset ring-yellow-200/60 dark:bg-yellow-950/40 dark:text-yellow-400 dark:ring-yellow-500/30">
                                <Clock className="h-3.5 w-3.5" />
                                Pending
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4 text-center text-sm font-semibold text-foreground w-[calc((100%-48px)/5)]">
                            {currencySymbol}
                            {p.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 text-center w-[calc((100%-48px)/5)]">
                            {!p.paid && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === p.id}
                                onClick={() => handleMarkAsPaid(p.id)}
                                className="gap-2 border-border/60 hover:bg-accent/50"
                              >
                                {updatingId === p.id
                                  ? "Updating..."
                                  : "Mark as Paid"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasPayments && (
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
                {paginationItems.map((item, indexItem) => (
                  <PaginationItem key={`${item}-${indexItem}`}>
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
    </Card>
  );
}
