import { Suspense } from "react";
import { getCurrentUser, getUserSettings } from "@/lib/data/user";
import { getGoalsForUser } from "@/lib/data/goals";
import GoalsClient from "./_components/GoalsClient";
import { redirect } from "next/navigation";

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, goals] = await Promise.all([
    getUserSettings(user.id),
    getGoalsForUser(user.id),
  ]);

  const currencySymbol = settings?.currency === "BRL" ? "R$" : "$";

  return (
    <GoalsClient 
      initialGoals={goals} 
      currencySymbol={currencySymbol} 
    />
  );
}
