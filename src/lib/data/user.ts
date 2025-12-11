import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Get current authenticated user
 * This is a server-side only function
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }
  
  return user;
});

/**
 * Get user settings
 */
export const getUserSettings = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }

  return data;
});
