import { Suspense } from "react";
import { getCurrentUser, getUserSettings } from "@/lib/data/user";
import { getCategoriesForUser } from "@/lib/data/categories";
import { getTransactionsForUser } from "@/lib/data/transactions";
import CategoriesClient from "./_components/CategoriesClient";
import { redirect } from "next/navigation";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, categories, transactions] = await Promise.all([
    getUserSettings(user.id),
    getCategoriesForUser(user.id),
    getTransactionsForUser(user.id, 1000), // Fetch last 1000 transactions to support client-side filtering
  ]);

  return (
    <CategoriesClient 
      initialCategories={categories} 
      initialTransactions={transactions}
      settings={settings}
      userId={user.id}
      userEmail={user.email || null}
    />
  );
}
