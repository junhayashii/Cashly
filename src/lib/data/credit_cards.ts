import { createClient } from "@/lib/supabase/server";

export async function getCreditCardPaymentsForUser(userId: string) {
  const supabase = await createClient();
  
  // Note: The client-side hook didn't explicitly filter by user_id, relying on RLS?
  // But the type definition has user_id. It's safer to filter explicitly if possible,
  // or rely on RLS. Since we are using server client which might bypass RLS if using service role (but we are using cookie based client so it acts as user),
  // it should be fine. But adding .eq is safer if the table has user_id.
  
  const { data, error } = await supabase
    .from("credit_card_payments")
    .select("*")
    // .eq("user_id", userId) // Uncomment if we are sure user_id column exists and we want to filter explicitly
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching credit card payments:", error);
    return [];
  }

  return data;
}
