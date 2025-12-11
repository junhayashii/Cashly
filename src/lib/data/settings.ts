import { createClient } from "@/lib/supabase/server";
import { UserSettings } from "@/types";

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching settings:", error);
    return null;
  }

  return data;
}
