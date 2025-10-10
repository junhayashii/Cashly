"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Supabase の認証呼び出し
    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      // ログイン・サインアップ成功時
      router.push("/success");
    }
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
      </form>

      <p className="text-sm text-center mt-4">
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
  );
}
