"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type VerifyStatus = "loading" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const nextParam = searchParams.get("next");
  const redirectTarget =
    nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  useEffect(() => {
    let active = true;

    const confirmEmail = async () => {
      const code = searchParams.get("code");
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setError("Verification link is invalid or expired. Please request a new one.");
          setStatus("error");
          return;
        }
        setError(null);
        setStatus("success");
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!active) return;
        if (error) {
          setError("Verification link is invalid or expired. Please request a new one.");
          setStatus("error");
          return;
        }
        setError(null);
        setStatus("success");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const user = data.session?.user;
      if (user && user.email_confirmed_at) {
        setError(null);
        setStatus("success");
        return;
      }
      setError("Missing verification details. Please open the link from your confirmation email.");
      setStatus("error");
    };

    confirmEmail();

    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.replace(redirectTarget);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [redirectTarget, router, status]);

  return (
    <div className="w-[360px] rounded-2xl border bg-white p-6 shadow-sm text-center">
      <h1 className="mb-2 text-xl font-semibold">Email Verification</h1>
      {status === "loading" && (
        <p className="text-sm text-muted-foreground">
          Verifying your email address...
        </p>
      )}
      {status === "success" && (
        <p className="text-sm text-green-600">
          Email verified successfully. Redirecting to your dashboard...
        </p>
      )}
      {status === "error" && (
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button variant="outline" onClick={() => router.push("/signup")}>
            Request new email
          </Button>
          <Button onClick={() => router.push("/login")}>Go to login</Button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
