import { createClient } from "@/lib/supabase/server";

export async function getBillsForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_bills")
    .select("*")
    .eq("user_id", userId)
    .order("next_due_date", { ascending: true });

  if (error) {
    console.error("Error fetching bills:", error);
    return [];
  }

  return data;
}
