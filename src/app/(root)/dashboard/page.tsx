import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./_components/DashboardClient";
import { getSettings } from "@/lib/data/settings";
import { getBillsForUser } from "@/lib/data/bills";
import { getTransactionsForUser } from "@/lib/data/transactions";
import { getGoalsForUser } from "@/lib/data/goals";
import { getCategoriesForUser } from "@/lib/data/categories";
import { getAccountsForUser } from "@/lib/data/accounts";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel data fetching
  const [
    settings,
    transactions,
    goals,
    bills,
    categories,
    accounts
  ] = await Promise.all([
    getSettings(user.id),
    getTransactionsForUser(user.id),
    getGoalsForUser(user.id),
    getBillsForUser(user.id),
    getCategoriesForUser(user.id),
    getAccountsForUser(user.id)
  ]);

  return (
    <DashboardClient
      userId={user.id}
      initialTransactions={transactions || []}
      initialGoals={goals || []}
      initialBills={bills || []}
      initialCategories={categories || []}
      initialAccounts={accounts || []}
      settings={settings}
    />
  );
}
