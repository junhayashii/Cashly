"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Account } from "@/types";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching accounts:", error);
    } else if (data) {
      setAccounts(data);
    }

    setLoading(false);
  };

  const getAccountById = (id: string) => {
    return accounts.find((account) => account.id === id);
  };

  const addAccount = (newAccount: Account) => {
    setAccounts((prev) => [...prev, newAccount]);
  };

  const updateAccountBalance = (id: string, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, balance: newBalance } : a))
    );
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    loading,
    refresh: fetchAccounts,
    getAccountById,
    addAccount,
    updateAccountBalance,
  };
}
