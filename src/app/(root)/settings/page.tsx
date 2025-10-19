"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Globe } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useTheme } from "@/components/ThemeProvider";
import PluggyConnectLauncher from "@/components/PluggyConnectLauncher";

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notificationsUpdating, setNotificationsUpdating] = useState(false);

  const { theme, setTheme } = useTheme();

  // ダークモード切替
  setTheme(theme === "light" ? "dark" : "light");

  // Supabase AuthからユーザーID取得
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        toast({ title: "Error fetching user", variant: "destructive" });
        return;
      }
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email);
      }
    });
  }, [toast]);

  // Profiles hook
  const { profile, updateProfile } = useUserProfile(userId || undefined);

  // Settings hook
  const { settings, updateSettings } = useUserSettings(userId || undefined);

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
      });
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleNotificationsChange = async (checked: boolean) => {
    if (!userId) {
      toast({
        title: "User session required",
        description: "Sign in again to change notification preferences.",
        variant: "destructive",
      });
      return;
    }

    const previousValue = settings.notifications;
    setNotificationsUpdating(true);

    try {
      await updateSettings({ notifications: checked });

      if (checked) {
        if (!userEmail) {
          throw new Error("User email address is not available.");
        }

        const response = await fetch("/api/notifications/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            subject: "Cashly notifications enabled",
            message:
              "You turned on email notifications in Cashly. We'll keep you informed about important updates and alerts.",
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          const errorMessage =
            (errorBody && (errorBody.error || errorBody.message)) ??
            "Failed to send the notification email.";
          throw new Error(errorMessage);
        }

        toast({
          title: "Email notifications enabled",
          description: `We sent a confirmation email to ${userEmail}.`,
        });
      } else {
        toast({
          title: "Email notifications disabled",
          description: "You will no longer receive notification alerts.",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        "[Settings] Failed to update notification preference.",
        error
      );

      if (previousValue !== checked) {
        try {
          await updateSettings({ notifications: previousValue });
        } catch (revertError) {
          console.error(
            "[Settings] Failed to revert notification preference.",
            revertError
          );
        }
      }

      toast({
        title: "Failed to update notifications",
        description: message,
        variant: "destructive",
      });
    } finally {
      setNotificationsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.first_name}
                  onChange={(e) =>
                    updateProfile({ first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.last_name}
                  onChange={(e) => updateProfile({ last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={userEmail || ""} disabled />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>App Settings</CardTitle>
            </div>
            <CardDescription>Customize your preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Dark Mode</Label>

              <ThemeToggle
                enabled={settings.theme === "dark"}
                onToggle={() => {
                  const newTheme = settings.theme === "dark" ? "light" : "dark";
                  updateSettings({ theme: newTheme }); // DB保存
                }}
              />
            </div>

            {/* Currency */}
            <div className="flex items-center justify-between">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value })}
                className="border rounded px-2 py-1"
              >
                <option value="USD">USD ($)</option>
                <option value="BRL">BRL (R$)</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications"> Email Notifications</Label>
              <input
                id="notifications"
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleNotificationsChange(e.target.checked)}
                disabled={notificationsUpdating}
                className="h-5 w-5 accent-primary disabled:opacity-60"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Bank Connections</CardTitle>
            <CardDescription>
              Link new institutions through Pluggy Connect to import
              transactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PluggyConnectLauncher />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
