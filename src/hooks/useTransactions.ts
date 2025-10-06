"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Transaction } from "@/types";

export function useTransaction() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("Transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error(error);
    } else if (data) {
      setTransactions(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return { transactions, loading, refresh: fetchTransactions, setTransactions };
}
