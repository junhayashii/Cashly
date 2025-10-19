"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Supabase の認証呼び出し
    const emailRedirectTo =
      !isLogin && typeof window !== "undefined"
        ? `${window.location.origin}/verify-email`
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
      router.push("/dashboard");
      return;
    }

    setMessage(
      "Verification email sent. Please check your inbox and confirm your address."
    );
    setPassword("");
    await supabase.auth.signOut();
  };

  return (
    <div className="w-[360px] p-6 rounded-2xl border shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {isLogin ? "Sign In" : "Sign Up"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
        </Button>
        {message && <p className="text-sm text-green-600 text-center">{message}</p>}
      </form>

      <div className="mt-4 text-sm text-center space-y-2">
        {isLogin && <ForgotPasswordDialog />}
        <p>
          {isLogin ? (
            <>
              No account?{" "}
              <a href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                Sign in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
