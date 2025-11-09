import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState({ first_name: "", last_name: "" });

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name,last_name")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId })
          .select("first_name,last_name")
          .single();

        if (!insertError && newProfile) {
          setProfile({
            first_name: newProfile.first_name ?? "",
            last_name: newProfile.last_name ?? "",
          });
        }
        return;
      }

      if (data) {
        setProfile({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
        });
      }
    };

    fetchProfile();
  }, [userId]);

  async function updateProfile(updates: {
    first_name?: string;
    last_name?: string;
  }) {
    if (!userId) return;

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
