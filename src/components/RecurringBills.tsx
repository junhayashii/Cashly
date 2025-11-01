import { useMemo, useState } from "react";
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
import { Badge } from "./ui/badge";
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

const RecurringBills = ({
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
    paidBills,
    pendingBills,
    overdueBills,
  } = billsHook;

  const { payments, refresh: refreshCreditPayments } = creditHook;
  const { accounts } = useAccounts();
  const accountsMap = useMemo(
    () =>
      new Map(accounts.map((account) => [account.id, account.name])),
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
      (a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
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
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
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

  const creditStatusFor = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(due.getTime())) {
      return {
        text: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    }
    if (due < today) {
      return {
        text: "Overdue",
        color: "bg-red-100 text-red-800 border-red-200",
      };
    }
    return {
      text: "Pending",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
  };

  const handleRecordCreditGroup = async (
    group: {
      id: string;
      title: string;
      amount: number;
      dueDate: string;
      payments: CreditCardPaymentActionItem[];
      bill?: RecurringBill;
    }
  ) => {
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
    <div>
      {/* Bills List */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">Upcoming</h3>
              <Badge variant="outline" className="text-xs">
                {paidBills} Paid
              </Badge>
              <Badge variant="outline" className="text-xs">
                {pendingBills} Pending
              </Badge>
              {overdueBills > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueBills} Overdue
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div>
                Recurring:{" "}
                <span className="font-medium text-foreground">
                  {currencySymbol}
                  {totals.recurringTotal.toFixed(2)}
                </span>
              </div>
              <div>
                Credit Cards:{" "}
                <span className="font-medium text-foreground">
                  {currencySymbol}
                  {totals.creditTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Recurring Bill
            </Button>
          </div>
        </div>

        {loading && !hasAnySource ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading upcoming payments...
          </div>
        ) : !hasAnySource ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No recurring bills
            </h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first recurring bill
            </p>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Recurring Bill
            </Button>
          </div>
        ) : !hasUpcoming ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No upcoming payments
            </h3>
            <p className="text-muted-foreground">
              You are all caught up. New payments will appear here when they are due.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingItems.map((item) => {
              const isCreditGroup = item.kind === "creditGroup";
              const bill = item.bill;
              const statusBadge = bill && !isCreditGroup
                ? {
                    text: getStatusText(bill),
                    color: getStatusColor(bill),
                  }
                : creditStatusFor(item.dueDate);
              const amountValue = Number(item.amount ?? 0);
              return (
                <div
                  key={`${item.kind}:${item.id}`}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {bill?.is_paid ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground">
                        {item.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {isCreditGroup
                            ? `Auto pay on ${formatDate(item.dueDate)}`
                            : bill?.is_paid
                            ? `Next on ${formatDate(bill.next_due_date)}`
                            : `Due ${formatDate(item.dueDate)}`}
                        </span>
                        {item.kind === "recurring" && (
                          <>
                            <span>•</span>
                            <span>{getFrequencyText(item.frequency)}</span>
                          </>
                        )}
                        {item.paymentMethod && (
                          <>
                            <span>•</span>
                            <span>{item.paymentMethod}</span>
                          </>
                        )}
                        {isCreditGroup && (
                          <>
                            <span>•</span>
                            <span>Credit Card</span>
                          </>
                        )}
                        {isCreditGroup && (
                          <>
                            <span>•</span>
                            <span>
                              {item.payments.length} payment
                              {item.payments.length > 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {currencySymbol}
                        {amountValue.toFixed(2)}
                      </p>
                      <Badge className={`text-xs ${statusBadge.color}`}>
                        {statusBadge.text}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.kind === "recurring" && bill && !bill.is_paid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setBillToPay(bill);
                            setIsPayOpen(true);
                          }}
                          className="text-xs"
                        >
                          Record Payment
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
                          onClick={() =>
                            handleRecordCreditGroup({
                              id: item.id,
                              title: item.title,
                              amount: item.amount,
                              dueDate: item.dueDate,
                              payments: item.payments,
                              bill: item.bill,
                            })
                          }
                          className="text-xs"
                        >
                          {groupRecordingId === item.id
                            ? "Recording..."
                            : "Record Payment"}
                        </Button>
                      )}

                      {bill?.is_paid && (
                        <span className="text-xs text-green-600">Paid</span>
                      )}

                      {bill && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedBill(bill);
                              setIsEditOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBill(bill.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {isCreditGroup && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-xs"
                          onClick={() => toggleGroupDetails(item.id)}
                          aria-label="Toggle details"
                        >
                          {expandedGroups[item.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Details
                        </Button>
                      )}
                    </div>
                  </div>

                  {isCreditGroup && expandedGroups[item.id] && (
                    <div className="mt-4 w-full space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between text-foreground">
                        <span className="font-medium">Payment breakdown</span>
                        <span className="text-xs">
                          Total {currencySymbol}
                          {item.amount.toFixed(2)}
                        </span>
                      </div>
                      {item.payments.map((payment, index) => (
                        <div
                          key={payment.id}
                          className="relative overflow-hidden rounded-md border border-border bg-background px-3 py-2 shadow-sm"
                          style={{
                            marginTop: index === 0 ? 0 : index * 8,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-foreground font-medium">
                                {payment.title}
                              </div>
                              <div>Due {formatDate(payment.due_date)}</div>
                            </div>
                            <div className="font-semibold text-foreground">
                              {currencySymbol}
                              {payment.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
    </div>
  );
};

export default RecurringBills;
