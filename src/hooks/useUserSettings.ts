import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUserSettings(userId?: string) {
  const [settings, setSettings] = useState({
    theme: "light",
    currency: "USD",
    notifications: true,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // 行がない場合は作成
        const { data: newData } = await supabase
          .from("settings")
          .insert({ user_id: userId })
          .select()
          .single();
        setSettings(newData);
      } else if (data) {
        setSettings(data);
      }
    };

    fetchSettings();
  }, [userId]);

  const updateSettings = async (updates: Partial<typeof settings>) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("settings")
      .upsert({ user_id: userId, ...updates }, { onConflict: ["user_id"] })
      .select()
      .single();

    if (!error && data) setSettings(data);
  };

  return { settings, updateSettings };
}
