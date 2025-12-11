"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface CreditCardPayment {
  id: string;
  user_id: string;
  card_id: string;
  title: string;
  amount: number;
  installment_number: number;
  total_installments: number;
  due_date: string;
  paid: boolean;
  created_at?: string;
}

export function useCreditCardPayments(initialPayments: CreditCardPayment[] = []) {
  const [payments, setPayments] = useState<CreditCardPayment[]>(initialPayments);
  const [loading, setLoading] = useState(initialPayments.length === 0);

  const fetchPayments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("credit_card_payments")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      console.error(error);
    } else if (data) {
      setPayments(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (initialPayments.length > 0) {
      setPayments(initialPayments);
      setLoading(false);
    } else {
      fetchPayments();
    }
  }, [initialPayments]);

  return { payments, loading, refresh: fetchPayments };
}

export type CreditCardPaymentsHook = ReturnType<typeof useCreditCardPayments>;
