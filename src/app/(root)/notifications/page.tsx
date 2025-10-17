"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellDot,
  BellOff,
  CheckCheck,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  message: string;
  related_id: string | null;
  created_at: string;
  is_read: boolean;
};

const formatType = (type: string) =>
  type
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "unread">("all");
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

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(
    () =>
      tab === "all"
        ? notifications
        : notifications.filter((notification) => !notification.is_read),
    [notifications, tab]
  );

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) {
      console.error("Failed to mark notifications as read:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, is_read: true }))
    );
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.is_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      if (error) {
        console.error("Failed to mark notification as read:", error);
      } else {
        setNotifications((prev) =>
          prev.map((existing) =>
            existing.id === notification.id
              ? { ...existing, is_read: true }
              : existing
          )
        );
      }
    }

    if (notification.related_id) {
      router.push(`/categories`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex items-start gap-4 py-5">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Review account updates, budget reminders, and category alerts as
            soon as they happen.
          </p>
        </div>
        <div className="flex flex-col-reverse items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">
            Unread
            <span className="ml-1 font-semibold text-foreground">
              {unreadCount}
            </span>
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="gap-2"
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "all" | "unread")}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">
            All
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              {notifications.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              {unreadCount}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                <BellOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">You&apos;re all caught up</CardTitle>
              <CardDescription>
                {tab === "unread"
                  ? "No unread notifications right now."
                  : "We'll let you know when something new shows up."}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const displayType = formatType(notification.type);

            return (
              <Card
                key={notification.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-md",
                  notification.is_read
                    ? "bg-card"
                    : "border-primary/30 bg-primary/5"
                )}
                onClick={() => handleClick(notification)}
              >
                <CardContent className="flex items-start gap-4 py-5 sm:py-6">
                  <div
                    className={cn(
                      "mt-1 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm",
                      notification.is_read
                        ? "border-muted-foreground/20 text-muted-foreground"
                        : "border-primary/40 bg-primary/10 text-primary"
                    )}
                  >
                    {notification.is_read ? (
                      <Bell className="h-5 w-5" />
                    ) : (
                      <BellDot className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold leading-snug sm:text-lg">
                          {displayType}
                          {!notification.is_read && (
                            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              New
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed text-foreground">
                          {notification.message}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground sm:text-sm">
                        <Clock className="h-4 w-4" />
                        {dayjs(notification.created_at).format(
                          "MMM D, YYYY [at] h:mm A"
                        )}
                      </div>
                    </div>

                    {notification.related_id ? (
                      <div className="inline-flex items-center gap-1 text-xs font-medium text-primary sm:text-sm">
                        View related category
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
