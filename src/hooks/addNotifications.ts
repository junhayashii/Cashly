"use client";

import { supabase } from "@/lib/supabaseClient";

export async function addNotification({
  userId,
  type,
  relatedId,
  message,
}: {
  userId: string;
  type: string;
  relatedId?: string; // ← relatedId を UUID 文字列として扱う
  message: string;
}): Promise<boolean> {
  if (!userId) return false;

  try {
    let query = supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type);

    if (relatedId) {
      query = query.eq("related_id", relatedId);
    } else {
      query = query.is("related_id", null);
    }

    const { data: existing, error: selectError } = await query.maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
      throw selectError;
    }

    if (existing) {
      return false;
    }

    const { error: insertError } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        type,
        related_id: relatedId || null,
        message,
      },
    ]);

    if (insertError) {
      if (insertError.code === "23505") {
        return false;
      }
      throw insertError;
    }

    return true;
  } catch (err) {
    console.error("Error adding notification:", err);
    return false;
  }
}
