"use client";

import { useEffect, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, Globe } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  // ページロード時にSupabaseからユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        toast({ title: "Error fetching user", variant: "destructive" });
        return;
      }

      if (user) {
        setUserData({
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          email: user.email || "",
        });
      }
    };

    fetchUser();
  }, [toast]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: updateError,
      } = await supabase.auth.updateUser({
        email: userData.email,
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
        },
      });

      if (updateError) throw updateError;

      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      console.error(error);
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
                  value={userData.first_name}
                  onChange={(e) =>
                    setUserData({ ...userData, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={userData.last_name}
                  onChange={(e) =>
                    setUserData({ ...userData, last_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the app theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Dark Mode</Label>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
