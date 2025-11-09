import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

type ThemeOption = "light" | "dark";

export type UserSettings = {
  user_id?: string;
  theme: ThemeOption;
  currency: string;
  notifications: boolean;
  is_pro: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  currency: "USD",
  notifications: true,
  is_pro: false,
  stripe_customer_id: null,
  stripe_subscription_id: null,
};

const applyDefaults = (data?: Partial<UserSettings>): UserSettings => ({
  user_id: data?.user_id,
  theme: data?.theme ?? DEFAULT_SETTINGS.theme,
  currency: data?.currency ?? DEFAULT_SETTINGS.currency,
  notifications: data?.notifications ?? DEFAULT_SETTINGS.notifications,
  is_pro: data?.is_pro ?? DEFAULT_SETTINGS.is_pro,
  stripe_customer_id:
    data?.stripe_customer_id ?? DEFAULT_SETTINGS.stripe_customer_id,
  stripe_subscription_id:
    data?.stripe_subscription_id ?? DEFAULT_SETTINGS.stripe_subscription_id,
});

export function useUserSettings(userId?: string) {
  const [settings, setSettings] = useState(applyDefaults());

  const fetchSettings = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      const { data: newData } = await supabase
        .from("settings")
        .insert({ user_id: userId })
        .select()
        .single();
      setSettings(applyDefaults(newData ?? undefined));
      return;
    }

    if (data) {
      setSettings(applyDefaults(data));
    }
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("settings")
        .upsert({ user_id: userId, ...updates }, { onConflict: ["user_id"] })
        .select()
        .single();

      if (!error && data) setSettings(applyDefaults(data));
    },
    [userId]
  );

  return { settings, updateSettings, refreshSettings: fetchSettings };
}
