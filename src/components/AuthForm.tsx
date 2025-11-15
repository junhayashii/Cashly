"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";

type AuthFormProps = {
  mode: "signup" | "login";
  nextPath?: string;
};

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
    <path
      fill="#4285F4"
      d="M23.52 12.272c0-.851-.076-1.67-.218-2.455H12v4.645h6.46a5.523 5.523 0 0 1-2.395 3.623v3.011h3.868c2.266-2.084 3.587-5.153 3.587-8.824"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.956-1.077 7.941-2.904l-3.868-3.011c-1.075.722-2.449 1.152-4.073 1.152-3.131 0-5.783-2.115-6.733-4.958H1.253v3.111A11.997 11.997 0 0 0 12 24"
    />
    <path
      fill="#FBBC05"
      d="M5.267 14.279a7.194 7.194 0 0 1 0-4.558V6.611H1.253a12.01 12.01 0 0 0 0 10.778z"
    />
    <path
      fill="#EA4335"
      d="M12 4.749a6.51 6.51 0 0 1 4.602 1.8l3.433-3.433A11.532 11.532 0 0 0 12 0 11.997 11.997 0 0 0 1.253 6.611l4.014 3.111C6.217 6.866 8.869 4.749 12 4.749"
    />
  </svg>
);

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : null;
  const googleButtonLabel = isLogin
    ? "Continue with Google"
    : "Sign up with Google";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!isLogin && password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    // Supabase の認証呼び出し
    const emailRedirectTo =
      !isLogin && typeof window !== "undefined"
        ? `${window.location.origin}/verify-email${
            safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""
          }`
        : undefined;
    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
          },
        });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // ログイン・サインアップ成功時
    if (isLogin) {
      const user = data?.user;
      if (user && !user.email_confirmed_at) {
        setError("Please verify your email before signing in.");
        await supabase.auth.signOut();
        return;
      }
      router.push(safeNextPath ?? "/dashboard");
      return;
    }

    setMessage(
      "Verification email sent. Please check your inbox and confirm your address."
    );
    setPassword("");
    setConfirmPassword("");
    await supabase.auth.signOut();
  };

  const handleGoogleSignIn = async () => {
    if (typeof window === "undefined") return;
    setGoogleLoading(true);
    setError(null);
    setMessage(null);

    const redirectUrl = `${window.location.origin}/oauth/callback${
      safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""
    }`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {(error || message) && (
        <div className="space-y-3">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert className="border-sky-100 bg-sky-50 text-slate-700">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-slate-600"
          >
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-slate-600"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
          />
          {isLogin && (
            <div className="text-right">
              <ForgotPasswordDialog />
            </div>
          )}
        </div>

        {!isLogin && (
          <div className="space-y-1.5">
            <Label
              htmlFor="confirm-password"
              className="text-sm font-medium text-slate-600"
            >
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
            />
          </div>
        )}

        <Button
          type="submit"
          className="group relative h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-base font-semibold text-white shadow-[0_18px_60px_rgba(15,23,42,0.35)] transition-all hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-sky-200"
          disabled={loading}
        >
          {loading ? "Signing you in..." : isLogin ? "Sign in" : "Continue"}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          Or continue with
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting..." : googleButtonLabel}
        </Button>
      </div>

      <p className="text-center text-sm text-slate-600">
        {isLogin ? (
          <>
            No account yet?{" "}
            <a
              href={
                safeNextPath
                  ? `/signup?next=${encodeURIComponent(safeNextPath)}`
                  : "/signup"
              }
              className="font-semibold text-sky-600 underline-offset-4 hover:underline"
            >
              Create one
            </a>
          </>
        ) : (
          <>
            Already a member?{" "}
            <a
              href={
                safeNextPath
                  ? `/login?next=${encodeURIComponent(safeNextPath)}`
                  : "/login"
              }
              className="font-semibold text-sky-600 underline-offset-4 hover:underline"
            >
              Sign in
            </a>
          </>
        )}
      </p>
    </div>
  );
}
