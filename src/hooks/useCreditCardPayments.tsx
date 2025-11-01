"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useCreditCardPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchPayments();
  }, []);

  return { payments, loading, refresh: fetchPayments };
}

export type CreditCardPaymentsHook = ReturnType<typeof useCreditCardPayments>;
