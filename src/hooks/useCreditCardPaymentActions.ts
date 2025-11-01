import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { ensureCreditCardPayment } from "@/lib/creditCardPayments";
import {
  calculateNextDueDate,
} from "@/lib/recurringBills";
import type { RecurringBill } from "@/hooks/useBills";

export interface CreditCardPaymentActionItem {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date?: string;
  user_id?: string;
  card_id?: string;
}

interface CreditCardPaymentActionsOptions {
  refresh?: () => void | Promise<void>;
  markBillCyclePaid?: (
    bill: RecurringBill,
    nextDueDate: string,
    updates?: Partial<RecurringBill>
  ) => void;
  fetchBills?: () => void | Promise<void>;
}

export function useCreditCardPaymentActions(
  options: CreditCardPaymentActionsOptions = {}
) {
  const { toast } = useToast();
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  const processPayment = useCallback(
    async (
      payment: CreditCardPaymentActionItem,
      billOverride?: RecurringBill
    ) => {
      const key =
        billOverride !== undefined ? `bill:${billOverride.id}` : `payment:${payment.id}`;
      setRecordingKey(key);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not found");

        const userId = user.id;

        const paymentAmount = payment.amount ?? billOverride?.amount ?? 0;
        if (!paymentAmount) {
          throw new Error("Unable to determine payment amount.");
        }

        // Record transaction
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert([
            {
              title: payment.title,
              amount: -paymentAmount,
              date: new Date().toISOString().split("T")[0],
              account_id: payment.card_id ?? billOverride?.account_id ?? null,
              category_id: billOverride?.category_id ?? null,
              user_id: userId,
            },
          ]);

        if (transactionError) throw transactionError;

        // Mark credit card payment as paid
        const { error: markError } = await supabase
          .from("credit_card_payments")
          .update({
            paid: true,
            paid_date: new Date().toISOString(),
          })
          .eq("id", payment.id);

        if (markError) throw markError;

        // Try updating the linked recurring bill
        let recurringBill = billOverride;

        if (!recurringBill && payment.card_id) {
          const { data: bills, error: billsError } = await supabase
            .from("recurring_bills")
            .select("*")
            .eq("user_id", userId)
            .eq("account_id", payment.card_id)
            .eq("title", payment.title)
            .limit(1);

          if (billsError) throw billsError;
          recurringBill = bills?.[0] as RecurringBill | undefined;
        }

        if (recurringBill) {
          const nextDue =
            calculateNextDueDate(
              recurringBill.next_due_date,
              recurringBill.frequency
            ) || recurringBill.next_due_date;

          const { error: billError } = await supabase
            .from("recurring_bills")
            .update({
              next_due_date: nextDue,
              updated_at: new Date().toISOString(),
            })
            .eq("id", recurringBill.id)
            .eq("user_id", userId);

          if (billError) throw billError;

          if (recurringBill.account_id) {
            await ensureCreditCardPayment({
              supabase,
              userId,
              accountId: recurringBill.account_id,
              title: recurringBill.title,
              amount: paymentAmount,
              dueDate: nextDue,
            });
          }

          options.markBillCyclePaid?.(recurringBill, nextDue);
        }

        if (options.refresh) {
          await options.refresh();
        }
        if (options.fetchBills) {
          await options.fetchBills();
        }

        toast({ title: "Payment recorded" });
      } catch (error) {
        console.error("Error recording credit payment:", error);
        toast({
          title: "Recording failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to record credit card payment.",
          variant: "destructive",
        });
      } finally {
        setRecordingKey(null);
      }
    },
    [options, toast]
  );

  const recordCreditPaymentByPayment = useCallback(
    async (payment: CreditCardPaymentActionItem) => {
      await processPayment(payment);
    },
    [processPayment]
  );

  const recordCreditPaymentByBill = useCallback(
    async (bill: RecurringBill) => {
      const key = `bill:${bill.id}`;
      setRecordingKey(key);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not found");

        const { data: payments, error: paymentsError } = await supabase
          .from("credit_card_payments")
          .select("*")
          .eq("user_id", user.id)
          .eq("card_id", bill.account_id)
          .eq("title", bill.title)
          .eq("paid", false)
          .order("due_date", { ascending: true })
          .limit(1);

        if (paymentsError) throw paymentsError;

        const payment = payments?.[0] as CreditCardPaymentActionItem | undefined;
        if (!payment) {
          throw new Error("No pending installment found for this bill.");
        }

        await processPayment(payment, bill);
      } catch (error) {
        console.error("Error recording credit payment:", error);
        toast({
          title: "Recording failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to record credit card payment.",
          variant: "destructive",
        });
      } finally {
        setRecordingKey(null);
      }
    },
    [processPayment, toast]
  );

  return {
    recordCreditPaymentByPayment,
    recordCreditPaymentByBill,
    recordingKey,
  };
}
