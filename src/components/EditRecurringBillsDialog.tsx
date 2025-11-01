import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { RecurringBill } from "@/hooks/useBills";
import {
  calculateNextDueDate,
  PAYMENT_METHOD_OPTIONS,
  requiresAccountSelection,
  CREDIT_PAYMENT_METHOD,
} from "@/lib/recurringBills";
import type { PaymentMethod, Frequency } from "@/lib/recurringBills";
import { ensureCreditCardPayment } from "@/lib/creditCardPayments";

interface EditRecurringBillsDialogProps {
  open: boolean;
  onClose: () => void;
  recurringBill: RecurringBill | null;
  onSuccess?: () => void;
}

export default function EditRecurringBillsDialog({
  open,
  onClose,
  recurringBill,
  onSuccess,
}: EditRecurringBillsDialogProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const previousPaymentMethodRef = useRef<PaymentMethod | "">("");
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const NONE_VALUE = "__none__";

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const userId = userData?.user?.id;
        if (!userId) {
          setAccounts([]);
          setCategories([]);
          return;
        }

        const [
          { data: accountsData, error: accountsError },
          { data: categoriesData, error: categoriesError },
        ] = await Promise.all([
          supabase
            .from("accounts")
            .select("id, name")
            .eq("user_id", userId),
          supabase
            .from("categories")
            .select("id, name")
            .eq("user_id", userId),
        ]);

        if (accountsError) throw accountsError;
        if (categoriesError) throw categoriesError;

        setAccounts(accountsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (recurringBill) {
      setTitle(recurringBill.title || "");
      setAmount(recurringBill.amount?.toString() || "");
      setFrequency((recurringBill.frequency as Frequency) || "monthly");
      setNextDueDate(recurringBill.next_due_date?.split("T")[0] || "");
      setStartDate(
        recurringBill.start_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0]
      );
      setAccountId(recurringBill.account_id || "");
      setCategoryId(recurringBill.category_id || "");
      const method =
        (recurringBill.payment_method as PaymentMethod) || "";
      setPaymentMethod(method);
      previousPaymentMethodRef.current = method;
    }
  }, [recurringBill]);


  const handleSave = async () => {
    try {
      if (!recurringBill) return;

      const safeNextDueDate =
        nextDueDate ||
        calculateNextDueDate(startDate, frequency) ||
        startDate;

      if (!title || !amount || !safeNextDueDate) {
        alert("Please fill in all required fields.");
        return;
      }

      const selectedPaymentMethod = paymentMethod || null;
      if (
        selectedPaymentMethod &&
        requiresAccountSelection(selectedPaymentMethod) &&
        !accountId
      ) {
        alert("Please choose an account for credit payments.");
        return;
      }

      const parsedAmount = parseFloat(amount);
      if (Number.isNaN(parsedAmount)) {
        alert("Invalid amount.");
        return;
      }

      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      const updatedBill = {
        title,
        amount: parsedAmount,
        frequency,
        next_due_date: safeNextDueDate,
        start_date: startDate || new Date().toISOString().split("T")[0], // ← keep consistent with date column
        account_id: accountId || null,
        category_id: categoryId || null,
        payment_method: selectedPaymentMethod,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("recurring_bills")
        .update(updatedBill)
        .eq("id", recurringBill.id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating recurring bill:", error);
        alert("Failed to update recurring bill.");
      } else {
        if (
          selectedPaymentMethod === CREDIT_PAYMENT_METHOD &&
          accountId
        ) {
          try {
            await ensureCreditCardPayment({
              supabase,
              userId,
              accountId,
              title,
              amount: parsedAmount,
              dueDate: startDate || safeNextDueDate,
            });
          } catch (creditError) {
            console.error(
              "Error scheduling credit payment:",
              creditError
            );
          }
        }
        previousPaymentMethodRef.current = selectedPaymentMethod || "";
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error("Unexpected error updating recurring bill:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!recurringBill) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Recurring Bill</DialogTitle>
        </DialogHeader>
        <DialogDescription>Edit a recurring payment.</DialogDescription>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Spotify"
            />
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 25.00"
            />
          </div>

          <div>
            <Label>Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value) => {
                const nextFrequency = value as Frequency;
                setFrequency(nextFrequency);
                if (startDate) {
                  const computed = calculateNextDueDate(
                    startDate,
                    nextFrequency
                  );
                  setNextDueDate(computed || startDate);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select
              value={paymentMethod || NONE_VALUE}
              onValueChange={(value) =>
                setPaymentMethod(
                  value === NONE_VALUE ? "" : (value as PaymentMethod)
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                const value = e.target.value;
                setStartDate(value);
                if (value) {
                  const computed = calculateNextDueDate(value, frequency);
                  setNextDueDate(computed || value);
                } else {
                  setNextDueDate("");
                }
              }}
            />
          </div>

          <div>
            <Label>Next Due Date</Label>
            <Input type="date" value={nextDueDate} disabled />
          </div>

          <div>
            <Label>Account</Label>
            <Select
              value={accountId || NONE_VALUE}
              onValueChange={(value) =>
                setAccountId(value === NONE_VALUE ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
