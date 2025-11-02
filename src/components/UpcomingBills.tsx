import { useMemo, useState } from "react";
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

    return items
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      .slice(0, 10);
  }, [upcomingRecurring, upcomingCreditGroups]);

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
  const hasUpcoming = upcomingItems.length > 0;

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
      <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-background/60 shadow-sm backdrop-blur-sm">
        <div className="bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  Upcoming Bills
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {upcomingItems.length}
                  </span>{" "}
                  upcoming {upcomingItems.length === 1 ? "payment" : "payments"}
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

        <div className="flex-1 min-h-0 px-4 pb-4 overflow-auto">
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
            <div className="h-full overflow-x-auto overflow-y-auto rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm shadow-sm">
              <Table className="table-fixed w-full">
                <TableHeader className="sticky top-0 z-20 border-b border-border/50 bg-muted/80 backdrop-blur-md shadow-sm">
                  <TableRow className="hover:bg-transparent bg-muted/80">
                    <TableHead className="h-12 w-[60px] text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      <div className="flex items-center justify-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"></div>
                      </div>
                    </TableHead>
                    <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)/6)]">
                      Title
                    </TableHead>
                    <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)/6)]">
                      Due Date
                    </TableHead>
                    <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)/6)]">
                      Payment Method
                    </TableHead>
                    <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)/6)]">
                      Frequency
                    </TableHead>
                    <TableHead className="h-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)/6)]">
                      Amount
                    </TableHead>
                    <TableHead className="h-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-[calc((100%-60px)/6)]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingItems.flatMap((item, index) => {
                    const isCreditGroup = item.kind === "creditGroup";
                    const bill = item.bill;
                    const amountValue = Number(item.amount ?? 0);
                    const isExpanded = isCreditGroup && expandedGroups[item.id];
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
                          index % 2 === 0
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
                        <TableCell className="py-4 w-[calc((100%-60px)/6)]">
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
                              <div className="h-8 w-8" aria-hidden="true"></div>
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
                        <TableCell className="py-4 text-sm text-muted-foreground w-[calc((100%-60px)/6)]">
                          {isCreditGroup
                            ? formatDate(item.dueDate)
                            : bill?.is_paid
                            ? formatDate(bill.next_due_date)
                            : formatDate(item.dueDate)}
                        </TableCell>
                        <TableCell className="py-4 text-sm text-muted-foreground w-[calc((100%-60px)/6)]">
                          {item.paymentMethod ||
                            (isCreditGroup ? "Credit Card" : "-")}
                        </TableCell>
                        <TableCell className="py-4 text-sm text-muted-foreground w-[calc((100%-60px)/6)]">
                          {item.kind === "recurring"
                            ? getFrequencyText(item.frequency)
                            : "-"}
                        </TableCell>
                        <TableCell className="py-4 text-center w-[calc((100%-60px)/6)]">
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-semibold text-foreground">
                              {currencySymbol}
                              {amountValue.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center w-[calc((100%-60px)/6)]">
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
                              <TableCell className="py-3 text-sm font-medium text-foreground w-[calc((100%-60px)/6)]">
                                {payment.title}
                              </TableCell>
                              <TableCell className="py-3 text-sm text-muted-foreground w-[calc((100%-60px)/6)]">
                                {formatDate(payment.due_date)}
                              </TableCell>
                              <TableCell className="py-3 text-sm text-muted-foreground w-[calc((100%-60px)/6)]">
                                Credit Card
                              </TableCell>
                              <TableCell className="py-3 text-sm text-muted-foreground w-[calc((100%-60px)/6)]">
                                -
                              </TableCell>
                              <TableCell className="py-3 text-center w-[calc((100%-60px)/6)]">
                                <span className="text-sm font-semibold text-foreground">
                                  {currencySymbol}
                                  {payment.amount.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 text-center w-[calc((100%-60px)/6)]">
                                {(payment as any).installment_number &&
                                (payment as any).total_installments ? (
                                  <span className="text-xs text-muted-foreground">
                                    {(payment as any).installment_number}/
                                    {(payment as any).total_installments}
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
