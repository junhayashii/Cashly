import type { SupabaseClient } from "@supabase/supabase-js";
import { toStartOfDayISOString } from "@/lib/recurringBills";

interface EnsureCreditCardPaymentParams {
  supabase: SupabaseClient;
  userId: string;
  accountId: string;
  title: string;
  amount: number;
  dueDate: string;
}

export const ensureCreditCardPayment = async ({
  supabase,
  userId,
  accountId,
  title,
  amount,
  dueDate,
}: EnsureCreditCardPaymentParams) => {
  const dueDateIso = toStartOfDayISOString(dueDate);
  if (!dueDateIso) return;

  const { data: existing, error: existingError } = await supabase
    .from("credit_card_payments")
    .select("id")
    .eq("user_id", userId)
    .eq("card_id", accountId)
    .eq("title", title)
    .eq("due_date", dueDateIso)
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  if (existing && existing.length > 0) {
    return;
  }

  const { error } = await supabase.from("credit_card_payments").insert([
    {
      id: crypto.randomUUID(),
      user_id: userId,
      card_id: accountId,
      title,
      amount,
      installment_number: 1,
      total_installments: 1,
      due_date: dueDateIso,
      paid: false,
    },
  ]);

  if (error) {
    throw error;
  }
};
