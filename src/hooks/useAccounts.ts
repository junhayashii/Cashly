
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Account } from "@/types";
import { createAccount as createAccountAction, updateAccount as updateAccountAction, deleteAccount as deleteAccountAction } from "@/app/actions/accounts";

export function useAccounts(initialAccounts: Account[] = []) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [loading, setLoading] = useState(initialAccounts.length === 0);

  useEffect(() => {
    if (initialAccounts.length > 0) {
      setAccounts(initialAccounts);
      setLoading(false);
    }
  }, [initialAccounts]);

  const fetchAccounts = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;
      setAccounts(data ?? []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setLoading(false);
    }
  }, []);

  // Only fetch on mount if no initial data
  useEffect(() => {
    if (initialAccounts.length === 0) {
      fetchAccounts();
    }
  }, [fetchAccounts, initialAccounts.length]);

  const getAccountById = (id: string) => {
    return accounts.find((account) => account.id === id);
  };

  const addAccount = async (newAccount: Account) => {
    // Optimistic update
    setAccounts((prev) => [...prev, newAccount]);
  };

  const updateAccountBalance = (id: string, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, balance: newBalance } : a))
    );
  };

  return {
    accounts,
    loading,
    refresh: fetchAccounts,
    getAccountById,
    addAccount,
    updateAccountBalance,
  };
}

