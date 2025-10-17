"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  message: string;
  related_id: string | null;
  created_at: string;
  is_read: boolean;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setNotifications(data || []);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const handleClick = async (notification: Notification) => {
    // 1️⃣ 既読に更新
    if (!notification.is_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      if (error) {
        console.error("Failed to mark notification as read:", error);
      } else {
        // ローカル状態も更新して即反映
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      }
    }

    // 2️⃣ Categoryページに遷移
    if (notification.related_id) {
      router.push(`/categories`);
    }
  };

  if (loading) return <p>Loading notifications...</p>;
  if (notifications.length === 0) return <p>No notifications yet.</p>;

  return (
    <div className="space-y-4">
      {notifications.map((n) => (
        <Card
          key={n.id}
          className={`cursor-pointer ${n.is_read ? "opacity-70" : "font-bold"}`}
          onClick={() => handleClick(n)}
        >
          <CardContent>
            <CardTitle>{n.type}</CardTitle>
            <CardDescription>
              {n.message} <br />
              <span className="text-xs text-muted-foreground">
                {dayjs(n.created_at).format("MMM D, YYYY HH:mm")}
              </span>
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
