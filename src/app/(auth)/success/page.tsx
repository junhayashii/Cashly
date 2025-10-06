import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="p-6 rounded-xl border shadow-sm bg-white text-center">
        <h1 className="text-2xl font-bold mb-4">ログイン成功 🎉</h1>
        <p>これでSupabase認証が動作していることが確認できました。</p>
        <Link href={"/"}>Go to Home</Link>
      </div>
    </main>
  );
}
