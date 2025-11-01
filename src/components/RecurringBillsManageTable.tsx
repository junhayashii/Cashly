"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CreditCard } from "lucide-react";
import type { BillsHook, RecurringBill } from "@/hooks/useBills";
import { CREDIT_PAYMENT_METHOD } from "@/lib/recurringBills";
import {
  useCreditCardPaymentActions,
} from "@/hooks/useCreditCardPaymentActions";
import type { CreditCardPaymentsHook } from "@/hooks/useCreditCardPayments";
import EditRecurringBillsDialog from "./EditRecurringBillsDialog";
import { PayRecurringBillDialog } from "./PayRecurringBillDialog";

interface RecurringBillsManageTableProps {
  billsHook: BillsHook;
  creditHook: CreditCardPaymentsHook;
  currencySymbol: string;
}

export function RecurringBillsManageTable({
  billsHook,
  creditHook,
  currencySymbol,
}: RecurringBillsManageTableProps) {
  const {
    bills,
    fetchBills,
    payBill,
    markBillCyclePaid,
    deleteBill,
    getStatusColor,
    getStatusText,
    formatDate,
    getFrequencyText,
  } = billsHook;

  const { refresh: refreshCreditPayments } = creditHook;

  const {
    recordCreditPaymentByBill,
    recordingKey,
  } = useCreditCardPaymentActions({
    refresh: refreshCreditPayments,
    markBillCyclePaid,
    fetchBills,
  });

  const [billToPay, setBillToPay] = useState<RecurringBill | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const sortedBills = useMemo(
    () =>
      [...bills].sort(
        (a, b) =>
          new Date(a.next_due_date).getTime() -
          new Date(b.next_due_date).getTime()
      ),
    [bills]
  );

  return (
    <div className="space-y-4">
      {sortedBills.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No recurring bills yet. Add your first one from the Upcoming tab.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Frequency</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBills.map((bill) => {
            const isCredit = bill.payment_method === CREDIT_PAYMENT_METHOD;
            const statusText = getStatusText(bill);
            const statusColor = getStatusColor(bill);
            return (
              <TableRow key={bill.id}>
                <TableCell className="font-medium text-foreground">
                  {bill.title}
                </TableCell>
                <TableCell>{formatDate(bill.next_due_date)}</TableCell>
                <TableCell>{getFrequencyText(bill.frequency)}</TableCell>
                <TableCell className="flex items-center gap-2">
                  {isCredit && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                  <span>{bill.payment_method ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${statusColor}`}>{statusText}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {currencySymbol}
                  {bill.amount.toFixed(2)}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      (isCredit && (!bill.account_id || recordingKey === `bill:${bill.id}`)) ||
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
                  >
                    {isCredit
                      ? recordingKey === `bill:${bill.id}`
                        ? "Recording..."
                        : "Record"
                      : "Record"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setSelectedBill(bill);
                      setIsEditOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteBill(bill.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
      )}

      <EditRecurringBillsDialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        recurringBill={selectedBill}
        onSuccess={fetchBills}
      />

      <PayRecurringBillDialog
        bill={billToPay}
        open={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        onSubmit={async (payload) => {
          if (!billToPay) return;
          await payBill(billToPay, payload);
          setIsPayOpen(false);
          setBillToPay(null);
        }}
      />
    </div>
  );
}
