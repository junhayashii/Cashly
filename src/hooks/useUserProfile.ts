import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState({ first_name: "", last_name: "" });

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data)
          setProfile({
            first_name: data.first_name,
            last_name: data.last_name,
          });
      });
  }, [userId]);

  async function updateProfile(updates: {
    first_name?: string;
    last_name?: string;
  }) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (!error && data)
      setProfile({ first_name: data.first_name, last_name: data.last_name });
  }

  return { profile, updateProfile };
}
