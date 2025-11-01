import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import {
  calculateNextDueDate,
  requiresAccountSelection,
  CREDIT_PAYMENT_METHOD,
} from "@/lib/recurringBills";
import type { PaymentMethod, Frequency } from "@/lib/recurringBills";

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  is_paid?: boolean;
  next_due_date: string;
  account_id: string | null;
  category_id: string | null;
  frequency: Frequency;
  start_date?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  payment_method?: PaymentMethod | null;
}

export function useBills() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [paidCycles, setPaidCycles] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const markBillCyclePaid = useCallback(
    (
      bill: RecurringBill,
      nextDueDate: string,
      updates: Partial<RecurringBill> = {}
    ) => {
      setPaidCycles((previous) => ({
        ...previous,
        [bill.id]: nextDueDate,
      }));

      setBills((previous) =>
        previous.map((existing) =>
          existing.id === bill.id
            ? {
                ...existing,
                ...updates,
                next_due_date: nextDueDate,
                is_paid: true,
              }
            : existing
        )
      );
    },
    []
  );

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) {
        setBills([]);
        return;
      }

      const { data, error } = await supabase
        .from("recurring_bills")
        .select("*")
        .eq("user_id", userId)
        .order("next_due_date", { ascending: true });

      if (error) {
        console.error("Error fetching bills:", error);
        toast({ title: "Error fetching bills", variant: "destructive" });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const normalized = (data || []).map((bill) => {
        const dueDate = new Date(bill.next_due_date);
        dueDate.setHours(0, 0, 0, 0);
        const futureDue = dueDate > today;
        const cyclePaid = paidCycles[bill.id] === bill.next_due_date;

        return {
          ...bill,
          is_paid: cyclePaid && futureDue,
        };
      });

      setBills(normalized);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast({ title: "Error fetching bills", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, paidCycles]);

  const payBill = async (
    bill: RecurringBill,
    options: {
      accountId?: string | null;
      paymentMethod?: PaymentMethod | "" | null;
      paymentDate?: string;
    } = {}
  ) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      const resolvedPaymentMethod =
        options.paymentMethod && options.paymentMethod !== ""
          ? options.paymentMethod
          : bill.payment_method || null;

      const resolvedAccountId =
        options.accountId !== undefined
          ? options.accountId
          : bill.account_id ?? null;

      if (
        resolvedPaymentMethod &&
        requiresAccountSelection(resolvedPaymentMethod) &&
        !resolvedAccountId
      ) {
        throw new Error("Account is required for credit payments.");
      }

      if (!resolvedPaymentMethod) {
        throw new Error("Please choose a payment method.");
      }

      if (resolvedPaymentMethod === CREDIT_PAYMENT_METHOD) {
        throw new Error(
          "Credit card payments are managed through the credit card section."
        );
      }

      const paymentDate =
        options.paymentDate || new Date().toISOString().split("T")[0];

      await supabase.from("transactions").insert([
        {
          title: bill.title,
          amount: -bill.amount,
          date: paymentDate,
          account_id: resolvedAccountId,
          category_id: bill.category_id,
          user_id: userId,
        },
      ]);

      const baseDate =
        bill.next_due_date || bill.start_date || paymentDate;
      const calculatedNext = calculateNextDueDate(baseDate, bill.frequency);
      const nextDueDate = calculatedNext || baseDate;

      await supabase
        .from("recurring_bills")
        .update({
          next_due_date: nextDueDate,
          account_id: resolvedAccountId,
          payment_method: resolvedPaymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bill.id)
        .eq("user_id", userId);

      markBillCyclePaid(
        bill,
        nextDueDate,
        {
          account_id: resolvedAccountId ?? null,
          payment_method: resolvedPaymentMethod,
        }
      );

      toast({ title: "Bill paid successfully" });
      fetchBills();
    } catch (error) {
      console.error("Error paying bill:", error);
      toast({
        title: "Payment failed",
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Unable to pay this bill.",
      });
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      const { error } = await supabase
        .from("recurring_bills")
        .delete()
        .eq("id", billId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting bill:", error);
        toast({ title: "Error deleting bill", variant: "destructive" });
        return;
      }

      toast({ title: "Bill deleted successfully" });
      setPaidCycles((previous) => {
        if (!(billId in previous)) return previous;
        const { [billId]: _removed, ...rest } = previous;
        return rest;
      });
      fetchBills();
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({ title: "Error deleting bill", variant: "destructive" });
    }
  };

  const getStatusColor = (bill: RecurringBill) => {
    if (bill.is_paid) return "bg-green-100 text-green-800 border-green-200";

    const dueDate = new Date(bill.next_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) return "bg-red-100 text-red-800 border-red-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getStatusText = (bill: RecurringBill) => {
    if (bill.is_paid) return "Paid";

    const dueDate = new Date(bill.next_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) return "Overdue";
    return "Pending";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFrequencyText = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  // Calculate metrics
  const totalBills = bills.length;
  const paidBills = bills.filter((bill) => bill.is_paid).length;
  const pendingBills = bills.filter((bill) => !bill.is_paid).length;
  const overdueBills = bills.filter((bill) => {
    if (bill.is_paid) return false;
    const dueDate = new Date(bill.next_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  const totalPendingAmount = bills
    .filter((bill) => !bill.is_paid)
    .reduce((sum, bill) => sum + bill.amount, 0);

  const totalOverdueAmount = bills
    .filter((bill) => {
      if (bill.is_paid) return false;
      const dueDate = new Date(bill.next_due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    })
    .reduce((sum, bill) => sum + bill.amount, 0);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return {
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
    // Metrics
    totalBills,
    paidBills,
    pendingBills,
    overdueBills,
    totalPendingAmount,
    totalOverdueAmount,
  };
}
