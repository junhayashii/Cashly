"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Transaction } from "@/types";

export function useTransaction(initialTransactions: Transaction[] = []) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [loading, setLoading] = useState(initialTransactions.length === 0);

  const fetchTransactions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .order("date", { ascending: false });

    if (error) {
      console.error(error);
    } else if (data) {
      setTransactions(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (initialTransactions.length > 0) {
      setTransactions(initialTransactions);
      setLoading(false);
    } else {
      fetchTransactions();
    }
  }, [initialTransactions]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
  };

  return { transactions, loading, refresh: fetchTransactions, setTransactions, addTransaction };
}
