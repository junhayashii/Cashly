export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b">
        <div className="container mx-auto flex justify-between">
          <h1 className="font-bold">MyApp</h1>
          <nav>
            <a href="/login" className="px-3">
              Login
            </a>
            <a href="/signup" className="px-3">
              Sign up
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t p-4 text-center text-sm">© 2025 MyApp</footer>
    </div>
  );
}
