"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  CreditCard,
  Plus,
  Search,
  Clock3,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
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

const formatDiffLabel = (diff: number) => {
  const absolute = Math.abs(diff);
  const plural = absolute === 1 ? "" : "s";
  return `${absolute} day${plural}`;
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
    getStatusColor,
    getStatusText,
    formatDate,
    getFrequencyText,
    totalBills,
    paidBills,
    pendingBills,
    overdueBills,
    totalPendingAmount,
    totalOverdueAmount,
  } = billsHook;

  const { refresh: refreshCreditPayments } = creditHook;

  const { recordCreditPaymentByBill, recordingKey } =
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

  const filtersActive =
    statusFilter !== "all" ||
    methodFilter !== "all" ||
    searchTerm.trim().length > 0;

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

  const paidAmount = useMemo(
    () =>
      bills
        .filter((bill) => bill.is_paid)
        .reduce((sum, bill) => sum + bill.amount, 0),
    [bills]
  );

  const projectedRecurringAmount = useMemo(
    () => bills.reduce((sum, bill) => sum + bill.amount, 0),
    [bills]
  );

  const filteredBills = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    const normalizedToday = new Date();
    normalizedToday.setHours(0, 0, 0, 0);

    return [...bills]
      .filter((bill) => {
        const matchesSearch =
          lowerSearch.length === 0 ||
          bill.title.toLowerCase().includes(lowerSearch);

        const dueDate = new Date(bill.next_due_date);
        const hasValidDue = !Number.isNaN(dueDate.getTime());
        if (hasValidDue) dueDate.setHours(0, 0, 0, 0);

        const isOverdue =
          !bill.is_paid && hasValidDue && dueDate < normalizedToday;
        const isPending =
          !bill.is_paid &&
          (!hasValidDue || dueDate.getTime() >= normalizedToday.getTime());

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "overdue" && isOverdue) ||
          (statusFilter === "pending" && isPending) ||
          (statusFilter === "paid" && bill.is_paid);

        const matchesMethod =
          methodFilter === "all"
            ? true
            : methodFilter === "credit"
            ? bill.payment_method === CREDIT_PAYMENT_METHOD
            : bill.payment_method !== CREDIT_PAYMENT_METHOD;

        return matchesSearch && matchesStatus && matchesMethod;
      })
      .sort((a, b) => {
        const aTime = new Date(a.next_due_date).getTime();
        const bTime = new Date(b.next_due_date).getTime();

        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;
        return aTime - bTime;
      });
  }, [bills, searchTerm, statusFilter, methodFilter]);

  const filteredTotalAmount = useMemo(
    () => filteredBills.reduce((sum, bill) => sum + bill.amount, 0),
    [filteredBills]
  );

  const describeDue = (bill: RecurringBill): { label: string; tone: DueTone } => {
    const dueDate = new Date(bill.next_due_date);

    if (Number.isNaN(dueDate.getTime())) {
      return { label: "Next due date unavailable", tone: "muted" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffInDaysRaw =
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    const diffInDays =
      diffInDaysRaw >= 0 ? Math.ceil(diffInDaysRaw) : Math.floor(diffInDaysRaw);

    if (bill.is_paid) {
      return {
        label: `Next cycle on ${formatDate(bill.next_due_date)}`,
        tone: "success",
      };
    }

    if (diffInDays < 0) {
      return {
        label: `Overdue by ${formatDiffLabel(diffInDays)}`,
        tone: "destructive",
      };
    }

    if (diffInDays === 0) {
      return { label: "Due today", tone: "warning" };
    }

    if (diffInDays === 1) {
      return { label: "Due tomorrow", tone: "warning" };
    }

    if (diffInDays <= 7) {
      return { label: `Due in ${formatDiffLabel(diffInDays)}`, tone: "warning" };
    }

    return { label: `Due in ${formatDiffLabel(diffInDays)}`, tone: "muted" };
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setMethodFilter("all");
    setSearchTerm("");
  };

  const managedCountLabel = filtersActive
    ? `${filteredBills.length} of ${totalBills}`
    : `${totalBills}`;

  const initialLoading = loading && totalBills === 0;
  const isRefreshing = loading && totalBills > 0;

  const stats = [
    {
      label: "Total Bills",
      value: totalBills,
      helper: `${formatAmount(projectedRecurringAmount)} projected`,
      icon: CalendarClock,
      iconWrapper:
        "bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary-foreground",
    },
    {
      label: "Pending",
      value: pendingBills,
      helper: `${formatAmount(totalPendingAmount)} awaiting`,
      icon: Clock3,
      iconWrapper:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      label: "Overdue",
      value: overdueBills,
      helper: `${formatAmount(totalOverdueAmount)} overdue`,
      icon: AlertTriangle,
      iconWrapper:
        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    },
    {
      label: "Paid (cycle)",
      value: paidBills,
      helper: `${formatAmount(paidAmount)} logged`,
      icon: CheckCircle2,
      iconWrapper:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
  ];

  return (
    <>
      <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-background/60 shadow-sm backdrop-blur-sm">
        <div className="bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col gap-6 px-4 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  Recurring Bills
                </h2>
                <p className="text-sm text-muted-foreground">
                  Managing{" "}
                  <span className="font-semibold text-foreground">
                    {managedCountLabel}
                  </span>{" "}
                  {totalBills === 1 ? "bill" : "bills"}
                </p>
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

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(({ label, value, helper, icon: Icon, iconWrapper }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 rounded-xl border border-border/40 bg-background/60 p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                        {label}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {value}
                      </p>
                    </div>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconWrapper}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground/80">
                    {helper}
                  </p>
                </div>
              ))}
            </div>

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

            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filteredBills.length}
              </span>
              {filtersActive && (
                <>
                  {" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {totalBills}
                  </span>
                </>
              )}{" "}
              bills · {formatAmount(filteredTotalAmount)} total
            </p>
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
          ) : totalBills === 0 ? (
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
            <div className="space-y-4">
              {isRefreshing && (
                <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>Refreshing bills…</span>
                </div>
              )}
              {filteredBills.map((bill) => {
                const isCredit = bill.payment_method === CREDIT_PAYMENT_METHOD;
                const statusText = getStatusText(bill);
                const statusColor = getStatusColor(bill);
                const dueDescriptor = describeDue(bill);
                const paymentLabel = bill.payment_method ?? "Unassigned";

                return (
                  <div
                    key={bill.id}
                    className="flex flex-col gap-4 rounded-xl border border-border/40 bg-background/50 p-4 transition-all duration-200 hover:border-primary/15 hover:bg-primary/8 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-semibold text-foreground">
                            {bill.title}
                          </h4>
                          {isCredit && (
                            <Badge
                              variant="outline"
                              className="border-primary/50 bg-primary/10 text-xs font-medium uppercase tracking-wide text-primary"
                            >
                              Credit synced
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Next due:{" "}
                            <span className="font-medium text-foreground/70">
                              {formatDate(bill.next_due_date)}
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
                          className={`text-xs font-medium ${dueToneClasses[dueDescriptor.tone]}`}
                        >
                          {dueDescriptor.label}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {formatAmount(bill.amount)}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`mt-1 border ${statusColor}`}
                          >
                            {statusText}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-border/30 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          (isCredit &&
                            (!bill.account_id ||
                              recordingKey === `bill:${bill.id}`)) ||
                          (!isCredit && bill.is_paid)
                        }
                        onClick={async () => {
                          if (isCredit) {
                            await recordCreditPaymentByBill(bill);
                          } else {
                            setBillToPay(bill);
                            setIsPayOpen(true);
                          }
                        }}
                        className="gap-2 border-border/60 hover:bg-accent/50"
                      >
                        {isCredit
                          ? recordingKey === `bill:${bill.id}`
                            ? "Recording..."
                            : "Record Payment"
                          : "Record Payment"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedBill(bill);
                          setIsEditOpen(true);
                        }}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBill(bill.id)}
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
