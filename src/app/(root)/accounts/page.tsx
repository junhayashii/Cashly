import { Suspense } from "react";
import { getCurrentUser, getUserSettings } from "@/lib/data/user";
import { getAccountsForUser } from "@/lib/data/accounts";
import { getTransactionsForUser } from "@/lib/data/transactions";
import AccountsClient from "./_components/AccountsClient";
import { redirect } from "next/navigation";

export default async function AccountsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, accounts, transactions] = await Promise.all([
    getUserSettings(user.id),
    getAccountsForUser(user.id),
    getTransactionsForUser(user.id, 1000),
  ]);

  return (
    <AccountsClient 
      initialAccounts={accounts} 
      initialTransactions={transactions}
      settings={settings}
    />
  );
}
