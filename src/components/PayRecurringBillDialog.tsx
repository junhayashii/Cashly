"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useToast } from "@/hooks/use-toast";
import type { RecurringBill } from "@/hooks/useBills";
import {
  CREDIT_PAYMENT_METHOD,
  PAYMENT_METHOD_OPTIONS,
  requiresAccountSelection,
} from "@/lib/recurringBills";
import type { PaymentMethod } from "@/lib/recurringBills";

interface PayRecurringBillDialogProps {
  bill: RecurringBill | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    accountId?: string | null;
    paymentMethod?: PaymentMethod | "" | null;
    paymentDate?: string;
  }) => Promise<void>;
}

export function PayRecurringBillDialog({
  bill,
  open,
  onClose,
  onSubmit,
}: PayRecurringBillDialogProps) {
  const { accounts } = useAccounts();
  const { toast } = useToast();

  const NONE_VALUE = "__none__";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [accountId, setAccountId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bill) {
      setPaymentMethod(
        bill.payment_method && bill.payment_method !== CREDIT_PAYMENT_METHOD
          ? bill.payment_method
          : ""
      );
      setAccountId(bill.account_id || "");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    } else {
      setPaymentMethod("");
      setAccountId("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    }
  }, [bill]);

  const paymentOptions = useMemo(
    () => PAYMENT_METHOD_OPTIONS.filter((method) => method !== CREDIT_PAYMENT_METHOD),
    []
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!bill) return;

    if (!paymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select how you paid this bill.",
        variant: "destructive",
      });
      return;
    }

    if (requiresAccountSelection(paymentMethod) && !accountId) {
      toast({
        title: "Account required",
        description: "Select the account that covered this payment.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        paymentMethod,
        accountId: accountId || null,
        paymentDate,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Log a transaction for <span className="font-medium">{bill.title}</span>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <div>
              Amount: <span className="text-foreground font-semibold">${bill.amount.toFixed(2)}</span>
            </div>
            <div>
              Due:{" "}
              <span className="text-foreground font-medium">
                {new Date(bill.next_due_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={paymentMethod || NONE_VALUE}
              onValueChange={(value) =>
                setPaymentMethod(
                  value === NONE_VALUE ? "" : (value as PaymentMethod)
                )
              }
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-account">Account</Label>
            <Select
              value={accountId || NONE_VALUE}
              onValueChange={(value) =>
                setAccountId(value === NONE_VALUE ? "" : value)
              }
            >
              <SelectTrigger id="payment-account">
                <SelectValue
                  placeholder={
                    paymentMethod && requiresAccountSelection(paymentMethod)
                      ? "Select account"
                      : "Optional"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Payment Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Record payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
