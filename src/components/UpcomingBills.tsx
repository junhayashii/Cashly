import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  Check,
  Clock,
  Pencil,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { AddRecurringBillDialog } from "./AddRecurringBillsDialog";
import EditRecurringBillsDialog from "./EditRecurringBillsDialog";
import { PayRecurringBillDialog } from "./PayRecurringBillDialog";
import { CREDIT_PAYMENT_METHOD } from "@/lib/recurringBills";
import type { BillsHook, RecurringBill } from "@/hooks/useBills";
import {
  useCreditCardPaymentActions,
  type CreditCardPaymentActionItem,
} from "@/hooks/useCreditCardPaymentActions";
import { useAccounts } from "@/hooks/useAccounts";
import type { CreditCardPaymentsHook } from "@/hooks/useCreditCardPayments";

interface RecurringBillsProps {
  currencySymbol: string;
  billsHook: BillsHook;
  creditHook: CreditCardPaymentsHook;
}

const UPCOMING_PAGE_SIZE = 10;

const UpcomingBills = ({
  currencySymbol,
  billsHook,
  creditHook,
}: RecurringBillsProps) => {
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<RecurringBill | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [groupRecordingId, setGroupRecordingId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [currentPage, setCurrentPage] = useState(1);

  const {
    bills,
    loading,
    fetchBills,
    payBill,
    markBillCyclePaid,
    deleteBill,
    formatDate,
    getFrequencyText,
    paidBills,
    pendingBills,
    overdueBills,
  } = billsHook;

  const { payments, refresh: refreshCreditPayments } = creditHook;
  const { accounts } = useAccounts();
  const accountsMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const { recordCreditPaymentByPayment } = useCreditCardPaymentActions({
    refresh: refreshCreditPayments,
    markBillCyclePaid,
    fetchBills,
  });

  const upcomingRecurring = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bills.filter((bill) => {
      if (bill.is_paid) return false;
      const due = new Date(bill.next_due_date);
      due.setHours(0, 0, 0, 0);
      return !Number.isNaN(due.getTime()) && due >= today;
    });
  }, [bills]);

  const upcomingCreditGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups = new Map<
      string,
      {
        id: string;
        title: string;
        total: number;
        nextDueDate: string;
        payments: CreditCardPaymentActionItem[];
        bill?: RecurringBill;
      }
    >();

    payments.forEach((payment) => {
      if (payment.paid) return;
      const due = new Date(payment.due_date);
      due.setHours(0, 0, 0, 0);
      if (Number.isNaN(due.getTime()) || due < today) return;

      const key = payment.card_id ?? `unknown:${payment.title}`;
      const accountName =
        (payment.card_id && accountsMap.get(payment.card_id)) ||
        payment.title ||
        "Credit Card";

      const linkedBill = bills.find(
        (bill) =>
          bill.payment_method === CREDIT_PAYMENT_METHOD &&
          bill.account_id &&
          payment.card_id &&
          bill.account_id === payment.card_id &&
          bill.title === payment.title
      );

      const existing = groups.get(key);
      if (existing) {
        existing.total += payment.amount;
        existing.payments.push(payment);
        if (new Date(payment.due_date) < new Date(existing.nextDueDate)) {
          existing.nextDueDate = payment.due_date;
        }
        if (!existing.bill && linkedBill) {
          existing.bill = linkedBill;
        }
      } else {
        groups.set(key, {
          id: key,
          title: accountName,
          total: payment.amount,
          nextDueDate: payment.due_date,
          payments: [payment],
          bill: linkedBill,
        });
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) =>
        new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
    );
  }, [payments, bills, accountsMap]);

  const upcomingItems = useMemo(() => {
    type UpcomingItem =
      | {
          kind: "recurring";
          id: string;
          title: string;
          amount: number;
          dueDate: string;
          paymentMethod: string | null | undefined;
          frequency: string;
          bill: RecurringBill;
        }
      | {
          kind: "creditGroup";
          id: string;
          title: string;
          amount: number;
          dueDate: string;
          paymentMethod: string | null | undefined;
          bill: RecurringBill | undefined;
          payments: CreditCardPaymentActionItem[];
        };

    const items: UpcomingItem[] = [
      ...upcomingRecurring.map((bill) => ({
        kind: "recurring" as const,
        id: bill.id,
        title: bill.title,
        amount: bill.amount,
        dueDate: bill.next_due_date,
        paymentMethod: bill.payment_method,
        frequency: bill.frequency,
        bill,
      })),
      ...upcomingCreditGroups.map((group) => ({
        kind: "creditGroup" as const,
        id: group.id,
        title: group.title,
        amount: group.total,
        dueDate: group.nextDueDate,
        paymentMethod: CREDIT_PAYMENT_METHOD,
        bill: group.bill,
        payments: group.payments,
      })),
    ];

    return items.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [upcomingRecurring, upcomingCreditGroups]);

  const totalUpcoming = upcomingItems.length;
  const totalPages = Math.max(1, Math.ceil(totalUpcoming / UPCOMING_PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedUpcomingItems = useMemo(
    () =>
      upcomingItems.slice(
        (currentPageSafe - 1) * UPCOMING_PAGE_SIZE,
        currentPageSafe * UPCOMING_PAGE_SIZE
      ),
    [upcomingItems, currentPageSafe]
  );
  const rangeStart =
    totalUpcoming === 0 ? 0 : (currentPageSafe - 1) * UPCOMING_PAGE_SIZE + 1;
  const rangeEnd = Math.min(
    currentPageSafe * UPCOMING_PAGE_SIZE,
    totalUpcoming
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [totalUpcoming]);

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

  const totals = useMemo(() => {
    const recurringTotal = upcomingRecurring.reduce(
      (sum, bill) => sum + (bill.amount || 0),
      0
    );

    const creditTotal = upcomingCreditGroups.reduce(
      (sum, group) => sum + (group.total || 0),
      0
    );

    return { recurringTotal, creditTotal };
  }, [upcomingRecurring, upcomingCreditGroups]);

  const hasAnySource = bills.length > 0 || upcomingCreditGroups.length > 0;
  const hasUpcoming = totalUpcoming > 0;

  const handleRecordCreditGroup = async (group: {
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    payments: CreditCardPaymentActionItem[];
    bill?: RecurringBill;
  }) => {
    if (group.payments.length === 0) return;
    setGroupRecordingId(group.id);
    try {
      for (const payment of group.payments) {
        await recordCreditPaymentByPayment(payment);
      }
      await refreshCreditPayments();
    } finally {
      setGroupRecordingId(null);
    }
  };

  const toggleGroupDetails = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <>
      <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background/60 shadow-sm backdrop-blur-sm">
        <div className="bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  Upcoming Bills
                </h2>
                <p className="text-sm text-muted-foreground">
                  {hasUpcoming ? (
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
                        {totalUpcoming}
                      </span>{" "}
                      upcoming {totalUpcoming === 1 ? "payment" : "payments"}
                    </>
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-foreground">0</span>{" "}
                      upcoming payments
                    </>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                  <div>
                    Recurring:{" "}
                    <span className="font-semibold text-foreground">
                      {currencySymbol}
                      {totals.recurringTotal.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    Credit Cards:{" "}
                    <span className="font-semibold text-foreground">
                      {currencySymbol}
                      {totals.creditTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsAddOpen(true)}
                  size="sm"
                  className="gap-2 border-border/60 hover:bg-accent/50"
                >
                  <Plus className="h-4 w-4" />
                  Add Recurring Bill
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4">
          {loading && !hasAnySource ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"></div>
                <p className="text-sm">Loading upcoming payments...</p>
              </div>
            </div>
          ) : !hasAnySource ? (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/30 backdrop-blur-sm">
              <div className="text-center space-y-4 px-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center ring-4 ring-background">
                  <Calendar className="h-7 w-7 text-muted-foreground/70" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-lg text-foreground">
                    No recurring bills
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Get started by adding your first recurring bill
                  </p>
                  <Button
                    onClick={() => setIsAddOpen(true)}
                    size="sm"
                    className="gap-2 mt-4 border-border/60 hover:bg-accent/50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Recurring Bill
                  </Button>
                </div>
              </div>
            </div>
          ) : !hasUpcoming ? (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/30 backdrop-blur-sm">
              <div className="text-center space-y-4 px-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center ring-4 ring-background">
                  <Calendar className="h-7 w-7 text-muted-foreground/70" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-lg text-foreground">
                    No upcoming payments
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    You are all caught up. New payments will appear here when
                    they are due.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex-1 min-h-0 space-y-3 flex flex-col">
                {/* Mobile cards */}
                <div className="space-y-3 min-[900px]:hidden max-h-[70vh] overflow-y-auto pr-1">
                  {paginatedUpcomingItems.map((item, index) => {
                    const globalIndex =
                      (currentPageSafe - 1) * UPCOMING_PAGE_SIZE + index;
                    const isCreditGroup = item.kind === "creditGroup";
                    const bill = item.bill;
                    const amountValue = Number(item.amount ?? 0);
                    const isExpanded =
                      isCreditGroup && expandedGroups[item.id];
                    const canOpenEdit = item.kind === "recurring" && !!bill;
                    const canToggleDetails = isCreditGroup;
                    const handleCardActivation = () => {
                      if (canOpenEdit && bill) {
                        setSelectedBill(bill);
                        setIsEditOpen(true);
                        return;
                      }
                      if (canToggleDetails) {
                        toggleGroupDetails(item.id);
                      }
                    };
                    const handleCardKeyDown = (
                      event: ReactKeyboardEvent<HTMLDivElement>
                    ) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleCardActivation();
                      }
                    };

                    return (
                      <div
                        key={`${item.kind}:mobile:${item.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={handleCardActivation}
                        onKeyDown={handleCardKeyDown}
                        className={`rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 hover:border-primary/20 hover:shadow-md ${
                          globalIndex % 2 === 0
                            ? "bg-background/60"
                            : "bg-background/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                              {bill?.is_paid ? (
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold text-foreground">
                                  {item.title}
                                </span>
                                {isCreditGroup && (
                                  <span className="text-[11px] text-muted-foreground">
                                    {item.payments.length} payment
                                    {item.payments.length > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                <span>
                                  {isCreditGroup
                                    ? formatDate(item.dueDate)
                                    : bill?.is_paid
                                    ? formatDate(bill.next_due_date)
                                    : formatDate(item.dueDate)}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true"></span>
                                <span>
                                  {item.paymentMethod ||
                                    (isCreditGroup ? "Credit Card" : "-")}
                                </span>
                                {item.kind === "recurring" && (
                                  <>
                                    <span
                                      className="h-1 w-1 rounded-full bg-muted-foreground/60"
                                      aria-hidden="true"
                                    ></span>
                                    <span>{getFrequencyText(item.frequency)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm font-semibold text-foreground">
                              {currencySymbol}
                              {amountValue.toFixed(2)}
                            </div>
                            {bill?.is_paid ? (
                              <span className="block text-[11px] text-emerald-600">
                                Paid
                              </span>
                            ) : (
                              <>
                                {item.kind === "recurring" &&
                                  bill &&
                                  !bill.is_paid && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setBillToPay(bill);
                                        setIsPayOpen(true);
                                      }}
                                      className="h-8 text-xs border-border/60 hover:bg-accent/50"
                                    >
                                      Pay
                                    </Button>
                                  )}
                                {isCreditGroup && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      groupRecordingId === item.id ||
                                      item.payments.length === 0
                                    }
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRecordCreditGroup({
                                        id: item.id,
                                        title: item.title,
                                        amount: item.amount,
                                        dueDate: item.dueDate,
                                        payments: item.payments,
                                        bill: item.bill,
                                      });
                                    }}
                                    className="h-8 text-xs border-border/60 hover:bg-accent/50"
                                  >
                                    {groupRecordingId === item.id
                                      ? "Recording..."
                                      : "Pay"}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {isCreditGroup && (
                          <div className="mt-2 space-y-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-2 px-2"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleGroupDetails(item.id);
                              }}
                              aria-label={
                                expandedGroups[item.id]
                                  ? "Collapse payments"
                                  : "Expand payments"
                              }
                            >
                              {expandedGroups[item.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="text-xs">
                                {expandedGroups[item.id]
                                  ? "Hide payments"
                                  : "View payments"}
                              </span>
                            </Button>

                            {isExpanded && (
                              <div className="space-y-2">
                                {item.payments.map((payment) => (
                                  <div
                                    key={payment.id}
                                    className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="space-y-1">
                                        <div className="text-sm font-medium text-foreground">
                                          {payment.title}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                          {formatDate(payment.due_date)}
                                        </div>
                                      </div>
                                      <div className="text-sm font-semibold text-foreground">
                                        {currencySymbol}
                                        {payment.amount.toFixed(2)}
                                      </div>
                                    </div>
                                    {"installment_number" in payment &&
                                    "total_installments" in payment ? (
                                      <div className="mt-1 text-[11px] text-muted-foreground">
                                        {(payment as CreditCardPaymentActionItem & { installment_number: number; total_installments: number }).installment_number}/
                                        {(payment as CreditCardPaymentActionItem & { installment_number: number; total_installments: number }).total_installments}{" "}
                                        installments
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden min-[900px]:flex flex-1 min-h-0">
                  <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-xl border border-border bg-background/60 backdrop-blur-sm shadow-sm">
                    <Table className="table-fixed w-full">
                      <TableHeader className="sticky top-0 z-20 border-b border-border/50 bg-muted/80 backdrop-blur-md shadow-sm">
                        <TableRow className="hover:bg-transparent bg-muted/80">
                          <TableHead className="h-12 w-[60px] text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                            <div className="flex items-center justify-center">
                              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"></div>
                            </div>
                          </TableHead>
                          <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)*0.34)]">
                            Title
                          </TableHead>
                          <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)*0.18)]">
                            Due Date
                          </TableHead>
                          <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)*0.13)]">
                            Payment Method
                          </TableHead>
                          <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)*0.1)]">
                            Frequency
                          </TableHead>
                          <TableHead className="h-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)*0.15)]">
                            Amount
                          </TableHead>
                          <TableHead className="h-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)*0.1)]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUpcomingItems.flatMap((item, index) => {
                          const globalIndex =
                            (currentPageSafe - 1) * UPCOMING_PAGE_SIZE + index;
                          const isCreditGroup = item.kind === "creditGroup";
                          const bill = item.bill;
                          const amountValue = Number(item.amount ?? 0);
                          const isExpanded =
                            isCreditGroup && expandedGroups[item.id];
                          const canOpenEdit = item.kind === "recurring" && !!bill;
                          const canToggleDetails = isCreditGroup;
                          const handleRowActivation = () => {
                            if (canOpenEdit && bill) {
                              setSelectedBill(bill);
                              setIsEditOpen(true);
                              return;
                            }
                            if (canToggleDetails) {
                              toggleGroupDetails(item.id);
                            }
                          };
                          const handleRowKeyDown = (
                            event: ReactKeyboardEvent<HTMLTableRowElement>
                          ) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleRowActivation();
                            }
                          };

                          return [
                            // Main row
                            <TableRow
                              key={`${item.kind}:${item.id}`}
                              tabIndex={0}
                              onClick={handleRowActivation}
                              onKeyDown={handleRowKeyDown}
                              className={`border-b border-border/25 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 ${
                                globalIndex % 2 === 0
                                  ? "bg-background/50"
                                  : "bg-background/40"
                              } hover:bg-primary/8 hover:border-primary/15 hover:shadow-sm cursor-pointer`}
                            >
                              <TableCell className="py-4 w-[60px]">
                                <div className="flex items-center justify-center">
                                  {bill?.is_paid ? (
                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4 w-[calc((100%-60px)*0.34)]">
                                <div className="flex items-start gap-3">
                                  {isCreditGroup ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 shrink-0 p-0"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        toggleGroupDetails(item.id);
                                      }}
                                      aria-label={
                                        expandedGroups[item.id]
                                          ? "Collapse details"
                                          : "Expand details"
                                      }
                                    >
                                      {expandedGroups[item.id] ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  ) : (
                                    <div
                                      className="h-8 w-8"
                                      aria-hidden="true"
                                    ></div>
                                  )}
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm text-foreground truncate">
                                      {item.title}
                                    </span>
                                    {isCreditGroup && (
                                      <span className="text-xs text-muted-foreground">
                                        {item.payments.length} payment
                                        {item.payments.length > 1 ? "s" : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 text-sm text-muted-foreground w-[calc((100%-60px)*0.18)]">
                                {isCreditGroup
                                  ? formatDate(item.dueDate)
                                  : bill?.is_paid
                                  ? formatDate(bill.next_due_date)
                                  : formatDate(item.dueDate)}
                              </TableCell>
                              <TableCell className="py-4 text-sm text-muted-foreground w-[calc((100%-60px)*0.13)]">
                                {item.paymentMethod ||
                                  (isCreditGroup ? "Credit Card" : "-")}
                              </TableCell>
                              <TableCell className="py-4 text-sm text-muted-foreground w-[calc((100%-60px)*0.1)]">
                                {item.kind === "recurring"
                                  ? getFrequencyText(item.frequency)
                                  : "-"}
                              </TableCell>
                              <TableCell className="py-4 text-center w-[calc((100%-60px)*0.15)]">
                                <div className="flex items-center justify-center">
                                  <span className="text-sm font-semibold text-foreground">
                                    {currencySymbol}
                                    {amountValue.toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 text-center w-[calc((100%-60px)*0.1)]">
                                <div className="flex items-center justify-center gap-2">
                                  {item.kind === "recurring" &&
                                    bill &&
                                    !bill.is_paid && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setBillToPay(bill);
                                          setIsPayOpen(true);
                                        }}
                                        className="text-xs border-border/60 hover:bg-accent/50"
                                      >
                                        Pay
                                      </Button>
                                    )}

                                  {isCreditGroup && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={
                                        groupRecordingId === item.id ||
                                        item.payments.length === 0
                                      }
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleRecordCreditGroup({
                                          id: item.id,
                                          title: item.title,
                                          amount: item.amount,
                                          dueDate: item.dueDate,
                                          payments: item.payments,
                                          bill: item.bill,
                                        });
                                      }}
                                      className="text-xs border-border/60 hover:bg-accent/50"
                                    >
                                      {groupRecordingId === item.id
                                        ? "Recording..."
                                        : "Pay"}
                                    </Button>
                                  )}

                                  {bill?.is_paid && (
                                    <span className="text-xs text-green-600">
                                      Paid
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>,
                            // Expanded payment rows for credit groups
                            ...(isExpanded
                              ? item.payments.map((payment, paymentIndex) => (
                                  <TableRow
                                    key={`${item.id}-payment-${payment.id}`}
                                    className={`border-b border-border/20 transition-all duration-200 bg-background/30 hover:bg-primary/5 hover:border-primary/10 ${
                                      paymentIndex % 2 === 0
                                        ? "bg-background/35"
                                        : "bg-background/30"
                                    }`}
                                  >
                                    <TableCell className="py-3 pl-12 w-[60px]">
                                      <div className="flex items-center justify-center">
                                        <div className="h-2 w-2 rounded-full bg-primary/60"></div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-sm font-medium text-foreground w-[calc((100%-60px)*0.34)]">
                                      {payment.title}
                                    </TableCell>
                                    <TableCell className="py-3 text-sm text-muted-foreground w-[calc((100%-60px)*0.18)]">
                                      {formatDate(payment.due_date)}
                                    </TableCell>
                                    <TableCell className="py-3 text-sm text-muted-foreground w-[calc((100%-60px)*0.13)]">
                                      Credit Card
                                    </TableCell>
                                    <TableCell className="py-3 text-sm text-muted-foreground w-[calc((100%-60px)*0.1)]">
                                      -
                                    </TableCell>
                                    <TableCell className="py-3 text-center w-[calc((100%-60px)*0.15)]">
                                      <span className="text-sm font-semibold text-foreground">
                                        {currencySymbol}
                                        {payment.amount.toFixed(2)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-3 text-center w-[calc((100%-60px)*0.1)]">
                                      {"installment_number" in payment &&
                                      "total_installments" in payment ? (
                                        <span className="text-xs text-muted-foreground">
                                          {(payment as CreditCardPaymentActionItem & { installment_number: number; total_installments: number }).installment_number}/
                                          {(payment as CreditCardPaymentActionItem & { installment_number: number; total_installments: number }).total_installments}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">
                                          -
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))
                              : []),
                          ];
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasUpcoming && (
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
                  {paginationItems.map((item, itemIndex) => (
                    <PaginationItem key={`${item}-${itemIndex}`}>
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
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        );
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

      <AddRecurringBillDialog
        open={isAddOpen}
        onOpenChange={(next) => setIsAddOpen(next)}
        onAdded={() => {
          setIsAddOpen(false);
          fetchBills();
        }}
      />
      {selectedBill && (
        <EditRecurringBillsDialog
          open={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedBill(null);
          }}
          recurringBill={selectedBill}
          onSuccess={() => {
            fetchBills();
            setIsEditOpen(false);
            setSelectedBill(null);
          }}
        />
      )}
      <PayRecurringBillDialog
        bill={billToPay}
        open={isPayOpen}
        onClose={() => {
          setIsPayOpen(false);
          setBillToPay(null);
        }}
        onSubmit={async (payload) => {
          if (!billToPay) return;
          await payBill(billToPay, payload);
          setIsPayOpen(false);
          setBillToPay(null);
        }}
      />
    </>
  );
};

export default UpcomingBills;
