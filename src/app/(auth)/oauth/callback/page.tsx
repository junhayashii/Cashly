"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type Status = "loading" | "error";

const OAUTH_ERROR =
  "Unable to finish Google sign in. Please try again or use another method.";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const nextParam = searchParams.get("next");
  const redirectTarget =
    nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  useEffect(() => {
    let active = true;

    const finalizeSignIn = async () => {
      const code = searchParams.get("code");
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      const redirectToApp = () => {
        if (!active) return;
        router.replace(redirectTarget);
      };

      const fail = (message: string) => {
        if (!active) return;
        setError(message);
        setStatus("error");
      };

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          fail(OAUTH_ERROR);
          return;
        }
        redirectToApp();
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          fail(OAUTH_ERROR);
          return;
        }
        redirectToApp();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        redirectToApp();
        return;
      }

      fail("Missing OAuth details. Please try signing in again.");
    };

    finalizeSignIn();

    return () => {
      active = false;
    };
  }, [redirectTarget, router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-[360px] rounded-2xl border bg-white p-6 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">Signing you in...</h1>
        {status === "loading" ? (
          <p className="text-sm text-muted-foreground">
            Please wait while we complete your Google sign in.
          </p>
        ) : (
          <>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="mt-4 space-y-2">
              <Button onClick={() => router.push("/login")}>Back to login</Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
