"use client";

// Prevent static generation for password reset
export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResetStatus = "pending" | "ready" | "error" | "success";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ResetStatus>("pending");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const initialiseSession = async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setError("The reset link is invalid or has expired. Please request a new one.");
          setStatus("error");
          return;
        }
        setStatus("ready");
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!active) return;
        if (error) {
          setError("The reset link is invalid or has expired. Please request a new one.");
          setStatus("error");
          return;
        }
        setStatus("ready");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStatus("ready");
      } else {
        setError("Recovery details were not provided. Please request a new reset email.");
        setStatus("error");
      }
    };

    initialiseSession();

    return () => {
      active = false;
    };
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    setInfo("Password updated successfully. Redirecting to the login page...");
    setSubmitting(false);
    setStatus("success");
    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login");
    }, 2500);
  };

  return (
    <div className="w-[360px] rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-xl font-semibold text-center">Reset Password</h1>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Set a new password for your account.
      </p>

      {status === "pending" && (
        <p className="text-sm text-center text-muted-foreground">
          Validating your reset link...
        </p>
      )}

      {status === "error" && (
        <div className="space-y-4 text-center">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={() => router.push("/login")} variant="outline">
            Back to login
          </Button>
        </div>
      )}

      {status === "ready" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating..." : "Update password"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/login")}
            disabled={submitting}
          >
            Back to login
          </Button>
        </form>
      )}

      {status === "success" && (
        <div className="space-y-4 text-center">
          {info && <p className="text-sm text-green-600">{info}</p>}
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to login
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
