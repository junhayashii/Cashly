"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Globe, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useTheme } from "@/components/ThemeProvider";
import dynamic from "next/dynamic";
const PluggyConnectLauncher = dynamic(
  () => import("@/components/PluggyConnectLauncher"),
  { ssr: false }
);
import { useSidebar } from "@/components/ui/sidebar";

const PRO_FEATURES = [
  "Unlimited bank and wallet accounts",
  "Pluggy bank connections & auto-sync",
  "Priority support and feature previews",
];
const PRO_PRICE = "$14.90/mo";

type SubscriptionInfo = {
  subscriptionId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  currentPeriodEnd: number | null;
  planNickname?: string | null;
  amount?: number | null;
  currency?: string | null;
};

const Settings = () => {
  const { toast } = useToast();
  const { isMobile } = useSidebar();
  const headerClass = isMobile ? "pl-12 space-y-2" : "space-y-2";
  const [loading, setLoading] = useState(false);
  const [notificationsUpdating, setNotificationsUpdating] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);
  const [upgradeHandled, setUpgradeHandled] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { theme, setTheme } = useTheme();

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
        setUserEmail(user.email ?? null);
      }
    });
  }, [toast]);

  // Profiles hook
  const { profile, updateProfile } = useUserProfile(userId || undefined);

  // Settings hook
  const { settings, updateSettings, refreshSettings } = useUserSettings(
    userId || undefined
  );

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme]);

  const fetchSubscriptionDetails = useCallback(async () => {
    if (!userId) return;
    if (!settings?.is_pro && !settings?.stripe_subscription_id) {
      setSubscriptionInfo(null);
      return;
    }

    try {
      const response = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error ?? "Unable to fetch subscription details."
        );
      }

      const data = await response.json();
      setSubscriptionInfo(data);
    } catch (error) {
      console.error("[Settings] Failed to fetch subscription info.", error);
      setSubscriptionInfo(null);
    }
  }, [settings?.is_pro, settings?.stripe_subscription_id, userId]);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [fetchSubscriptionDetails]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
      });
      toast({ title: "Profile updated successfully" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to update profile.";
      toast({
        title: "Error updating profile",
        description: message,
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

  const openPortalSession = async () => {
    if (!userId) {
      toast({
        title: "Please sign in again",
        description: "We need your user session to manage billing.",
        variant: "destructive",
      });
      return;
    }

    setPortalLoading(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error ?? "Unable to open the billing portal right now."
        );
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("Stripe did not return a billing portal URL.");
      }

      window.location.href = url;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Please try again or contact support so we can help cancel.";
      toast({
        title: "Cannot open billing portal",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const clearUpgradeParams = useCallback(() => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("upgrade");
    params.delete("session_id");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const confirmUpgrade = useCallback(
    async (sessionId: string) => {
      if (!sessionId || confirmingUpgrade) return;
      setConfirmingUpgrade(true);
      try {
        const response = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(
            errorBody?.error ?? "Failed to confirm your subscription."
          );
        }

        await refreshSettings();
        toast({
          title: "You're on Cashly Pro!",
          description: "Pluggy connections and premium features are unlocked.",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Please contact support so we can finish your upgrade.";
        toast({
          title: "Could not finalize upgrade",
          description: message,
          variant: "destructive",
        });
      } finally {
        setConfirmingUpgrade(false);
        setUpgradeHandled(true);
        clearUpgradeParams();
      }
    },
    [clearUpgradeParams, confirmingUpgrade, refreshSettings, toast]
  );

  const upgradeStatus = searchParams?.get("upgrade");
  const sessionIdFromParams = searchParams?.get("session_id");

  useEffect(() => {
    if (upgradeHandled || !upgradeStatus) return;

    if (upgradeStatus === "success") {
      if (sessionIdFromParams) {
        confirmUpgrade(sessionIdFromParams);
      } else {
        toast({
          title: "Upgrade confirmation missing",
          description:
            "We could not verify your payment session. Please use the upgrade button again.",
          variant: "destructive",
        });
        setUpgradeHandled(true);
        clearUpgradeParams();
      }
    } else if (upgradeStatus === "cancelled") {
      toast({
        title: "Checkout cancelled",
        description: "No charges were made. Upgrade whenever you're ready.",
      });
      setUpgradeHandled(true);
      clearUpgradeParams();
    } else if (upgradeStatus === "cta") {
      setPaymentDialogOpen(true);
      setUpgradeHandled(true);
      clearUpgradeParams();
    }
  }, [
    clearUpgradeParams,
    confirmUpgrade,
    sessionIdFromParams,
    toast,
    upgradeHandled,
    upgradeStatus,
  ]);

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

  const formatUnixDate = (seconds?: number | null) => {
    if (!seconds) return null;
    return new Date(seconds * 1000).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const cancellationDate = subscriptionInfo?.cancelAtPeriodEnd
    ? formatUnixDate(
        subscriptionInfo.currentPeriodEnd ?? subscriptionInfo.cancelAt
      )
    : null;

  const renewalDate =
    !subscriptionInfo?.cancelAtPeriodEnd && subscriptionInfo?.currentPeriodEnd
      ? formatUnixDate(subscriptionInfo.currentPeriodEnd)
      : null;

  const handleStripeCheckout = async () => {
    setCheckoutLoading(true);
    try {
      if (!userId || !userEmail) {
        throw new Error(
          "Your session is missing user details. Please sign in again."
        );
      }
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail: userEmail,
          userId,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error ?? "Failed to start checkout");
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      window.location.href = url;
    } catch (error) {
      console.error("Failed to start Stripe checkout:", error);
      toast({
        title: "Unable to start checkout",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className={headerClass}>
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
            {/* Account Type */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={settings.is_pro ? "default" : "outline"}>
                      {settings.is_pro ? "Pro" : "Standard"}
                    </Badge>
                    {!settings.is_pro && (
                      <span className="text-xs text-muted-foreground">
                        Standard plan includes up to 2 accounts.
                      </span>
                    )}
                  </div>
                  {settings.is_pro && (
                    <span
                      className={`text-xs ${
                        subscriptionInfo?.cancelAtPeriodEnd
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {subscriptionInfo?.cancelAtPeriodEnd && cancellationDate
                        ? `Your plan will be canceled on ${cancellationDate}.`
                        : subscriptionInfo?.cancelAtPeriodEnd
                        ? "Your plan is scheduled to cancel at the end of this billing period."
                        : renewalDate
                        ? `Renews on ${renewalDate}.`
                        : "Cancel or change billing anytime from the portal."}
                    </span>
                  )}
                </div>
                {settings.is_pro ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openPortalSession}
                    disabled={portalLoading || confirmingUpgrade}
                  >
                    {portalLoading ? "Opening..." : "Manage subscription"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setPaymentDialogOpen(true)}
                    disabled={checkoutLoading || confirmingUpgrade}
                  >
                    {checkoutLoading || confirmingUpgrade
                      ? "Finalizing..."
                      : "Upgrade to Pro"}
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Choose Pro to unlock advanced Cashly features as they roll out.
              </p>
              {subscriptionInfo?.cancelAtPeriodEnd && (
                <div className="rounded-md border border-amber-300 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                  {cancellationDate
                    ? `Your plan will be canceled on ${cancellationDate}.`
                    : "Your plan will be canceled at the end of the current billing period."}
                </div>
              )}
            </div>

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
            {settings.is_pro ? (
              <PluggyConnectLauncher />
            ) : (
              <div className="space-y-4 text-left">
                <p className="text-sm text-muted-foreground">
                  Pluggy bank connections are a Pro feature. Switch your account
                  type above to unlock unlimited syncs and automated imports.
                </p>
                <div className="flex flex-col gap-2">
                  {settings.is_pro ? (
                    <Button
                      onClick={openPortalSession}
                      disabled={portalLoading || confirmingUpgrade}
                      variant="outline"
                    >
                      {portalLoading ? "Opening..." : "Manage subscription"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setPaymentDialogOpen(true)}
                      disabled={
                        checkoutLoading || confirmingUpgrade || portalLoading
                      }
                    >
                      {checkoutLoading || confirmingUpgrade
                        ? "Finalizing..."
                        : "Upgrade to Pro"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
            <DialogDescription>
              Unlock Pluggy connections, unlimited accounts, and more powerful
              Cashly tools.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              {PRO_FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-primary mt-1" />
                  <p className="text-sm text-foreground">{feature}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Billing handled by Stripe. You can cancel any time.
              </p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={checkoutLoading || confirmingUpgrade || portalLoading}
              >
                Maybe later
              </Button>
              <Button
                type="button"
                onClick={handleStripeCheckout}
                disabled={checkoutLoading || confirmingUpgrade || portalLoading}
              >
                {checkoutLoading
                  ? "Redirecting..."
                  : `Upgrade for ${PRO_PRICE}`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
