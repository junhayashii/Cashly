import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Account } from "@/types";

/**
 * Cached function to fetch accounts for a user
 */
export const getAccountsForUser = cache(async (userId: string): Promise<Account[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }

  return data || [];
});

/**
 * Get account balance summary
 */
export const getAccountBalanceSummary = cache(async (userId: string) => {
  const accounts = await getAccountsForUser(userId);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const bankAccounts = accounts.filter((acc) => acc.type === "bank");
  const creditCards = accounts.filter((acc) => acc.type === "credit_card");

  return {
    totalBalance,
    bankAccountsCount: bankAccounts.length,
    creditCardsCount: creditCards.length,
    totalCreditLimit: creditCards.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0),
  };
});
