// src/app/page.tsx
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b p-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="font-bold text-lg">MyApp</h1>
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

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="text-4xl font-bold mb-4">
          Your productivity, reimagined.
        </h2>
        <p className="text-gray-600 mb-8">
          A better way to manage your projects.
        </p>
        <a href="/signup" className="px-6 py-3 bg-black text-white rounded-lg">
          Get Started
        </a>
      </main>

      {/* Footer */}
      <footer className="border-t p-4 text-center text-sm text-gray-500">
        © 2025 MyApp
      </footer>
    </div>
  );
}
