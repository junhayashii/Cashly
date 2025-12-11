import { Suspense } from "react";
import { getCurrentUser, getUserSettings } from "@/lib/data/user";
import { getTransactionsForUser } from "@/lib/data/transactions";
import { getBillsForUser } from "@/lib/data/bills";
import { getCreditCardPaymentsForUser } from "@/lib/data/credit_cards";
import TransactionsClient from "./_components/TransactionsClient";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, transactions, bills, creditCardPayments] = await Promise.all([
    getUserSettings(user.id),
    getTransactionsForUser(user.id, 1000),
    getBillsForUser(user.id),
    getCreditCardPaymentsForUser(user.id),
  ]);

  return (
    <TransactionsClient 
      initialTransactions={transactions} 
      initialBills={bills}
      initialCreditCardPayments={creditCardPayments}
      settings={settings}
      userId={user.id}
    />
  );
}
