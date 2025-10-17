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
}) {
  if (!userId) return;

  try {
    // 🧠 すでに同じ通知があるかチェック
    const { data: existing, error: selectError } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .eq("related_id", relatedId || null)
      .limit(1)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      // 👀 すでに同じ通知が存在するのでスキップ
      console.log("Notification already exists. Skipping insert.");
      return;
    }

    // ✨ 新しい通知を追加
    const { error: insertError } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        type,
        related_id: relatedId || null,
        message,
      },
    ]);

    if (insertError) throw insertError;
  } catch (err) {
    console.error("Error adding notification:", err);
  }
}
