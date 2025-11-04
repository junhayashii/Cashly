"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CreditCard,
  Plus,
  Search,
  Clock3,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AddRecurringBillDialog } from "./AddRecurringBillsDialog";
import type { BillsHook, RecurringBill } from "@/hooks/useBills";
import { CREDIT_PAYMENT_METHOD } from "@/lib/recurringBills";
import { useCreditCardPaymentActions } from "@/hooks/useCreditCardPaymentActions";
import type { CreditCardPaymentsHook } from "@/hooks/useCreditCardPayments";
import EditRecurringBillsDialog from "./EditRecurringBillsDialog";
import { PayRecurringBillDialog } from "./PayRecurringBillDialog";

interface RecurringBillsManageTableProps {
  billsHook: BillsHook;
  creditHook: CreditCardPaymentsHook;
  currencySymbol: string;
}

type StatusFilter = "all" | "pending" | "overdue" | "paid";
type MethodFilter = "all" | "credit" | "other";
type DueTone = "muted" | "warning" | "destructive" | "success";

const dueToneClasses: Record<DueTone, string> = {
  muted: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-red-600 dark:text-red-400",
  success: "text-emerald-600 dark:text-emerald-400",
};

const monthlyStatusStyles: Record<
  MonthlyStatus,
  { label: string; badge: string }
> = {
  paid: {
    label: "Paid",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  overdue: {
    label: "Overdue",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
};

const formatDiffLabel = (diff: number) => {
  const absolute = Math.abs(diff);
  const plural = absolute === 1 ? "" : "s";
  return `${absolute} day${plural}`;
};

type MonthlyStatus = "paid" | "pending" | "overdue";

type MonthlyBill = {
  bill: RecurringBill;
  nextDueDate: Date | null;
  monthlyStatus: MonthlyStatus;
};

export function RecurringBillsManageTable({
  billsHook,
  creditHook,
  currencySymbol,
}: RecurringBillsManageTableProps) {
  const {
    bills,
    loading,
    fetchBills,
    payBill,
    markBillCyclePaid,
    deleteBill,
    formatDate,
    getFrequencyText,
  } = billsHook;

  const { refresh: refreshCreditPayments } = creditHook;

  useCreditCardPaymentActions({
    refresh: refreshCreditPayments,
    markBillCyclePaid,
    fetchBills,
  });

  const [billToPay, setBillToPay] = useState<RecurringBill | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const formatAmount = (amount: number) =>
    `${currencySymbol}${amountFormatter.format(amount)}`;

  const { monthlyBills, today, paidAmount, monthlyStats } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(0, 0, 0, 0);

    const enriched: MonthlyBill[] = bills.map((bill) => {
      let nextDueDate: Date | null = null;
      if (bill.next_due_date) {
        const parsed = new Date(`${bill.next_due_date}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0);
          nextDueDate = parsed;
        }
      }

      let monthlyStatus: MonthlyStatus;
      if (bill.is_paid) {
        monthlyStatus = "paid";
      } else if (!nextDueDate) {
        monthlyStatus = "pending";
      } else if (nextDueDate < startOfMonth) {
        monthlyStatus = "overdue";
      } else if (nextDueDate > endOfMonth) {
        monthlyStatus = "paid";
      } else {
        monthlyStatus = "pending";
      }

      return {
        bill,
        nextDueDate,
        monthlyStatus,
      };
    });

    const paidAmount = enriched
      .filter((item) => item.monthlyStatus === "paid")
      .reduce((sum, item) => sum + item.bill.amount, 0);

    const monthlyStats = {
      total: enriched.length,
      paid: enriched.filter((item) => item.monthlyStatus === "paid").length,
      pending: enriched.filter((item) => item.monthlyStatus === "pending")
        .length,
      overdue: enriched.filter((item) => item.monthlyStatus === "overdue")
        .length,
      pendingAmount: enriched
        .filter((item) => item.monthlyStatus === "pending")
        .reduce((sum, item) => sum + item.bill.amount, 0),
      overdueAmount: enriched
        .filter((item) => item.monthlyStatus === "overdue")
        .reduce((sum, item) => sum + item.bill.amount, 0),
    };

    return {
      monthlyBills: enriched,
      today,
      paidAmount,
      monthlyStats,
    };
  }, [bills]);

  const filtersActive =
    statusFilter !== "all" ||
    methodFilter !== "all" ||
    searchTerm.trim().length > 0;

  const filteredBills = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    return [...monthlyBills]
      .filter(({ bill, monthlyStatus }) => {
        const matchesSearch =
          lowerSearch.length === 0 ||
          bill.title.toLowerCase().includes(lowerSearch);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "overdue" && monthlyStatus === "overdue") ||
          (statusFilter === "pending" && monthlyStatus === "pending") ||
          (statusFilter === "paid" && monthlyStatus === "paid");

        const matchesMethod =
          methodFilter === "all"
            ? true
            : methodFilter === "credit"
            ? bill.payment_method === CREDIT_PAYMENT_METHOD
            : bill.payment_method !== CREDIT_PAYMENT_METHOD;

        return matchesSearch && matchesStatus && matchesMethod;
      })
      .sort((a, b) => {
        const aTime = a.nextDueDate?.getTime() ?? Number.POSITIVE_INFINITY;
        const bTime = b.nextDueDate?.getTime() ?? Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
  }, [monthlyBills, searchTerm, statusFilter, methodFilter]);

  const resetFilters = () => {
    setStatusFilter("all");
    setMethodFilter("all");
    setSearchTerm("");
  };

  const monthlyTotal = monthlyStats.total;
  const hasAnyBills = bills.length > 0;

  const displayedCount = filtersActive ? filteredBills.length : monthlyTotal;
  const managedCountLabel = filtersActive
    ? `${filteredBills.length} of ${monthlyTotal}`
    : `${monthlyTotal}`;

  const initialLoading = loading && !hasAnyBills;
  const isRefreshing = loading && hasAnyBills;

  const stats = [
    {
      label: "Paid (cycle)",
      value: monthlyStats.paid,
      helper: `${formatAmount(paidAmount)} logged`,
      icon: CheckCircle2,
      iconWrapper:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Pending",
      value: monthlyStats.pending,
      helper: `${formatAmount(monthlyStats.pendingAmount)} awaiting`,
      icon: Clock3,
      iconWrapper:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      label: "Overdue",
      value: monthlyStats.overdue,
      helper: `${formatAmount(monthlyStats.overdueAmount)} overdue`,
      icon: AlertTriangle,
      iconWrapper:
        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    },
  ];

  return (
    <>
      <div className="space-y-3 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl font-semibold text-foreground">
              Recurring Bills
            </h2>
            <p className="text-sm text-muted-foreground">
              {today.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
              :{" "}
              <span className="font-semibold text-foreground">
                {managedCountLabel}
              </span>{" "}
              {displayedCount === 1 ? "bill" : "bills"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddOpen(true)}
              size="sm"
              className="h-9 gap-2 border-border/60 hover:bg-accent/40"
            >
              <Plus className="h-4 w-4" />
              Add Recurring Bill
            </Button>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(({ label, value, helper, icon: Icon, iconWrapper }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-background/60 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-foreground">
                    {value}
                  </p>
                </div>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs ${iconWrapper}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground/80">
                {helper}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-background/60 shadow-sm backdrop-blur-sm">
        <div className="bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col gap-3 px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search recurring bills"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as StatusFilter)
                    }
                  >
                    <SelectTrigger size="sm" className="min-w-[150px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={methodFilter}
                    onValueChange={(value) =>
                      setMethodFilter(value as MethodFilter)
                    }
                  >
                    <SelectTrigger size="sm" className="min-w-[170px]">
                      <SelectValue placeholder="All payment methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payment methods</SelectItem>
                      <SelectItem value="credit">Credit only</SelectItem>
                      <SelectItem value="other">Non-credit methods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filtersActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          {initialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="rounded-xl border border-border/40 bg-background/60 p-4"
                >
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="mt-3 h-3 w-1/2" />
                  <Skeleton className="mt-4 h-9 w-full" />
                </div>
              ))}
            </div>
          ) : !hasAnyBills ? (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/30 backdrop-blur-sm">
              <div className="space-y-4 px-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 ring-4 ring-background">
                  <CreditCard className="h-7 w-7 text-muted-foreground/70" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-lg font-semibold text-foreground">
                    No recurring bills yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add your first recurring bill to get started
                  </p>
                </div>
                <Button
                  onClick={() => setIsAddOpen(true)}
                  size="sm"
                  className="mt-2 gap-2 border-border/60 hover:bg-accent/50"
                >
                  <Plus className="h-4 w-4" />
                  Add Recurring Bill
                </Button>
              </div>
            </div>
          ) : monthlyTotal === 0 ? (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/30 text-center">
              <div className="space-y-3 px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted/40">
                  <CalendarClock className="h-6 w-6 text-muted-foreground/70" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    No recurring bills this month
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upcoming cycles fall outside of{" "}
                    {today.toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                    .
                  </p>
                </div>
              </div>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/30 text-center">
              <div className="space-y-4 px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted/40">
                  <Search className="h-6 w-6 text-muted-foreground/70" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    No bills match your filters
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or reset them to see all bills.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetFilters}
                    className="gap-2 border-border/60 hover:bg-accent/50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset filters
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {isRefreshing && (
                <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>Refreshing bills…</span>
                </div>
              )}
              {filteredBills.map(({ bill, nextDueDate, monthlyStatus }) => {
                const isCredit = bill.payment_method === CREDIT_PAYMENT_METHOD;
                const paymentLabel = bill.payment_method ?? "Unassigned";
                const statusMeta = monthlyStatusStyles[monthlyStatus];
                const formattedDue = bill.next_due_date
                  ? formatDate(bill.next_due_date)
                  : "—";

                let diffInDays: number | null = null;
                if (nextDueDate) {
                  const diffInDaysRaw =
                    (nextDueDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24);
                  diffInDays =
                    diffInDaysRaw >= 0
                      ? Math.ceil(diffInDaysRaw)
                      : Math.floor(diffInDaysRaw);
                }

                let dueDescriptor: { label: string; tone: DueTone };

                if (!nextDueDate) {
                  dueDescriptor = {
                    label: "Next due date unavailable",
                    tone: "muted",
                  };
                } else if (monthlyStatus === "paid") {
                  dueDescriptor = {
                    label: `Next due on ${formattedDue}`,
                    tone: "success",
                  };
                } else if (monthlyStatus === "overdue") {
                  dueDescriptor = {
                    label:
                      diffInDays !== null
                        ? `Overdue by ${formatDiffLabel(diffInDays)}`
                        : "Overdue",
                    tone: "destructive",
                  };
                } else if (diffInDays === 0) {
                  dueDescriptor = { label: "Due today", tone: "warning" };
                } else if (diffInDays === 1) {
                  dueDescriptor = { label: "Due tomorrow", tone: "warning" };
                } else if (diffInDays !== null && diffInDays <= 7) {
                  dueDescriptor = {
                    label: `Due in ${formatDiffLabel(diffInDays)}`,
                    tone: "warning",
                  };
                } else {
                  dueDescriptor = {
                    label:
                      diffInDays !== null
                        ? `Due in ${formatDiffLabel(diffInDays)}`
                        : "Upcoming",
                    tone: "muted",
                  };
                }

                return (
                  <div
                    key={bill.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/30 bg-background/50 p-2.5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/8 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-foreground">
                            {bill.title}
                          </h4>
                          {isCredit && (
                            <Badge
                              variant="outline"
                              className="border-primary/40 bg-primary/10 text-[10px] font-medium uppercase tracking-wide text-primary"
                            >
                              Credit synced
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>
                            Next due:{" "}
                            <span className="font-medium text-foreground/70">
                              {formattedDue}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            Frequency:{" "}
                            <span className="font-medium text-foreground/70">
                              {getFrequencyText(bill.frequency)}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            Method:{" "}
                            <span className="font-medium text-foreground/70">
                              {paymentLabel}
                            </span>
                          </span>
                        </div>
                        <p
                          className={`text-[10px] font-medium ${
                            dueToneClasses[dueDescriptor.tone]
                          }`}
                        >
                          {dueDescriptor.label}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-xs font-semibold text-foreground">
                          {formatAmount(bill.amount)}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`border text-[10px] ${statusMeta.badge}`}
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/20 bg-background/80 px-4 py-3">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Manage bill
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!isCredit && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={monthlyStatus === "paid"}
                            onClick={() => {
                              setBillToPay(bill);
                              setIsPayOpen(true);
                            }}
                            className="h-8 gap-1.5 border-border/60 px-3 text-xs font-medium hover:bg-accent/30"
                          >
                            Pay
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:bg-accent/30"
                              aria-label={`Manage ${bill.title}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedBill(bill);
                                setIsEditOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => deleteBill(bill.id)}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <AddRecurringBillDialog
        open={isAddOpen}
        onOpenChange={(next) => setIsAddOpen(next)}
        onAdded={() => {
          setIsAddOpen(false);
          fetchBills();
        }}
      />

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
}
